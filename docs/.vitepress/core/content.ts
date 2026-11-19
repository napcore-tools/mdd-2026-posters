/**
 * Reading the poster content in content/ (Node only: data loaders, route loaders, config).
 *
 * content/<slug>.md   metadata in front matter, body = text extracted from the PDF (search only)
 * content/<slug>.pdf  the printed poster
 * content/topics.csv  predefined topics, tab separated: slug, label, description
 *
 * Preview images of the PDFs are rendered by scripts/build-previews.mjs into docs/public/previews/.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

export const CONTENT_DIR = fileURLToPath(new URL('../../../content/', import.meta.url));
const PREVIEW_DIR = fileURLToPath(new URL('../../public/previews/', import.meta.url));

/** Widths of the preview images, see scripts/build-previews.mjs */
const PREVIEW_WIDTHS = [600, 1200];

/** Only posters with this status get a page and appear in the list */
export const PUBLISHED_STATUS = 'ready';

export interface Poster {
  slug: string;
  status: string;
  title: string;
  authors: string[];
  /** Slugs of topics from content/topics.csv */
  topics: string[];
  keywords: string[];
  /** One paragraph, up to 50 words */
  annotation: string;
  /** Published contact e-mail, if the authors provided one */
  email?: string;
  /** Page URL without the site base, e.g. "/posters/chimera" */
  url: string;
  /** Text extracted from the PDF, whitespace collapsed. For search only, never displayed. */
  text: string;
  /** Size of content/<slug>.pdf in bytes, 0 if the file is missing */
  pdfSize: number;
  /** Whether the preview images /previews/<slug>-600.jpg and -1200.jpg exist */
  hasPreview: boolean;
}

export interface Topic {
  slug: string;
  label: string;
  description: string;
}

const asList = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((v) => String(v).trim()).filter(Boolean) : [];

function fileSize(file: string): number {
  try {
    return statSync(file).size;
  } catch {
    return 0;
  }
}

/** Reads one content/<slug>.md; the slug is the file name */
export function readPoster(file: string): Poster {
  const slug = basename(file, '.md');
  const { data: fm, content } = matter(readFileSync(file, 'utf8'));
  if (fm.slug && fm.slug !== slug) {
    console.warn(`[posters] ${basename(file)}: front matter slug "${fm.slug}" differs from the file name`);
  }
  return {
    slug,
    status: String(fm.status ?? ''),
    title: String(fm.title ?? ''),
    authors: asList(fm.authors),
    topics: asList(fm.topics),
    keywords: asList(fm.keywords),
    annotation: String(fm.annotation ?? '').trim(),
    email: fm.email ? String(fm.email).trim() : undefined,
    url: `/posters/${slug}`,
    text: content.replace(/\s+/g, ' ').trim(),
    pdfSize: fileSize(file.replace(/\.md$/, '.pdf')),
    hasPreview: PREVIEW_WIDTHS.every((w) => existsSync(join(PREVIEW_DIR, `${slug}-${w}.jpg`))),
  };
}

/** Published posters from the given .md files (all of content/ by default), sorted by title */
export function readPosters(files?: string[]): Poster[] {
  const mdFiles =
    files ??
    readdirSync(CONTENT_DIR)
      .filter((f) => f.endsWith('.md'))
      .map((f) => join(CONTENT_DIR, f));
  return mdFiles
    .map(readPoster)
    .filter((p) => p.status === PUBLISHED_STATUS)
    .sort((a, b) => a.title.localeCompare(b.title, 'en'));
}

/** Reads content/topics.csv (tab separated, with a header row) */
export function readTopics(file = join(CONTENT_DIR, 'topics.csv')): Topic[] {
  const [header, ...rows] = readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim());
  const columns = header.split('\t').map((c) => c.trim());
  return rows.map((row) => {
    const cells = row.split('\t');
    const get = (name: string) => (cells[columns.indexOf(name)] ?? '').trim();
    return { slug: get('slug'), label: get('label'), description: get('description') };
  });
}
