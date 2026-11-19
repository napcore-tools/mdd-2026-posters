import { statSync } from 'node:fs';
import { join } from 'node:path';
import { createContentLoader, type SiteConfig } from 'vitepress';

/** One poster, read from docs/posters/<slug>.md */
export interface Poster {
  slug: string;
  status: string;
  title: string;
  /** Authors as provided, e.g. "Jane Doe, John Smith (Organisation)" */
  authors: string;
  /** Ids of the predefined topics */
  topics: string[];
  keywords: string[];
  /** One paragraph, up to 50 words */
  annotation: string;
  /** Published contact e-mail, if the authors provided one */
  email?: string;
  /** Page URL without the site base, e.g. "/posters/chimera" */
  url: string;
  /** Text extracted from the poster (the Markdown body), empty if not provided yet */
  text: string;
  /** Size of docs/public/posters/<slug>.pdf in bytes, 0 if the file is missing */
  pdfSize: number;
}

declare const data: Poster[];
export { data };

/** Only posters with this status are listed on the site */
export const PUBLISHED_STATUS = 'ready';

const asList = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);

/** The Markdown body without front matter and HTML comments */
export function bodyText(src: string): string {
  return src
    .replace(/^---\r?\n[\s\S]*?\r?\n---(\r?\n|$)/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
}

/** Size of a poster PDF in docs/public/posters/, 0 if missing */
function pdfSize(slug: string): number {
  // The resolved VitePress config, set by VitePress before data loaders run
  const config = (globalThis as { VITEPRESS_CONFIG?: SiteConfig }).VITEPRESS_CONFIG;
  if (!config) return 0;
  try {
    return statSync(join(config.publicDir, 'posters', `${slug}.pdf`)).size;
  } catch {
    return 0;
  }
}

export default createContentLoader('posters/*.md', {
  includeSrc: true,
  transform(pages): Poster[] {
    return pages
      .map(({ url, frontmatter: fm, src }) => ({
        slug: url.replace(/^.*\//, ''),
        status: String(fm.status ?? ''),
        title: String(fm.title ?? ''),
        authors: String(fm.authors ?? ''),
        topics: asList(fm.topics),
        keywords: asList(fm.keywords),
        annotation: String(fm.annotation ?? ''),
        email: fm.email ? String(fm.email) : undefined,
        url,
        text: bodyText(src ?? ''),
      }))
      .map((p) => ({ ...p, pdfSize: pdfSize(p.slug) }))
      .filter((p) => p.status === PUBLISHED_STATUS)
      .sort((a, b) => a.title.localeCompare(b.title, 'en'));
  },
});
