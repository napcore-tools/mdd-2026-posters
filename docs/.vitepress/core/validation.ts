/**
 * Checks the poster content in content/ and reports problems before the site is built.
 *
 * Errors would publish a broken or wrong poster, so they stop `npm run build`.
 * Warnings are printed only; the site is still built.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import matter from 'gray-matter';
import { CONTENT_DIR, PUBLISHED_STATUS, previewExists, readTopics } from './content.ts';

export interface Issue {
  level: 'error' | 'warning';
  /** File name in content/ */
  file: string;
  message: string;
}

/** Maximum annotation length; the poster page shows the whole annotation */
export const MAX_ANNOTATION_WORDS = 200;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isBlank = (v: unknown) => v === undefined || v === null || String(v).trim() === '';
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export function validateContent(dir = CONTENT_DIR): Issue[] {
  const issues: Issue[] = [];
  const error = (file: string, message: string) => issues.push({ level: 'error', file, message });
  const warn = (file: string, message: string) => issues.push({ level: 'warning', file, message });

  const files = readdirSync(dir);

  // Topics
  const topicSlugs = new Set<string>();
  if (!files.includes('topics.csv')) {
    error('topics.csv', 'file is missing');
  } else {
    for (const t of readTopics(join(dir, 'topics.csv'))) {
      if (!t.slug) error('topics.csv', `a row has no slug (label "${t.label}")`);
      else if (topicSlugs.has(t.slug)) error('topics.csv', `topic "${t.slug}" is listed twice`);
      if (t.slug && !t.label) error('topics.csv', `topic "${t.slug}" has no label`);
      if (t.slug) topicSlugs.add(t.slug);
    }
  }

  // Posters
  const mdSlugs = new Set(files.filter((f) => f.endsWith('.md')).map((f) => basename(f, '.md')));
  for (const slug of mdSlugs) {
    const file = `${slug}.md`;
    let fm: Record<string, unknown>;
    try {
      fm = matter(readFileSync(join(dir, file), 'utf8')).data;
    } catch (err) {
      error(file, `front matter cannot be read: ${err instanceof Error ? err.message.split('\n')[0] : err}`);
      continue;
    }

    if (fm.slug !== undefined && fm.slug !== slug) error(file, `slug "${fm.slug}" differs from the file name`);

    const published = fm.status === PUBLISHED_STATUS;
    if (!published) {
      warn(file, `status is "${fm.status ?? ''}", not "${PUBLISHED_STATUS}": the poster is not published`);
    }
    // Problems of unpublished posters do not affect the site
    const problem = published ? error : warn;

    if (isBlank(fm.title)) problem(file, 'title is missing');
    if (published && !files.includes(`${slug}.pdf`)) error(file, `${slug}.pdf is missing`);

    for (const t of list(fm.topics)) {
      if (!topicSlugs.has(String(t))) problem(file, `topic "${t}" is not in topics.csv`);
    }
    if (!list(fm.topics).length) warn(file, 'no topics: the poster appears under no topic filter');
    if (!list(fm.authors).length) warn(file, 'no authors');
    if (!list(fm.keywords).length) warn(file, 'no keywords');

    if (isBlank(fm.annotation)) warn(file, 'annotation is missing');
    else {
      const words = String(fm.annotation).trim().split(/\s+/).length;
      if (words > MAX_ANNOTATION_WORDS) warn(file, `annotation has ${words} words, more than ${MAX_ANNOTATION_WORDS}`);
    }

    if (!isBlank(fm.email) && !EMAIL.test(String(fm.email).trim())) warn(file, `e-mail "${fm.email}" looks invalid`);

    if (published && files.includes(`${slug}.pdf`) && !previewExists(slug)) {
      warn(file, 'no preview image: run npm run previews (the site shows a stand-in)');
    }
  }

  for (const pdf of files.filter((f) => f.endsWith('.pdf'))) {
    if (!mdSlugs.has(basename(pdf, '.pdf'))) warn(pdf, 'no matching .md file: the PDF is not published');
  }

  return issues;
}

/**
 * Prints the issues. With `failOnError`, throws if there are errors, which stops the build.
 */
export function reportIssues(issues: Issue[], { failOnError }: { failOnError: boolean }): void {
  if (!issues.length) return;
  const errors = issues.filter((i) => i.level === 'error');
  const lines = [...errors, ...issues.filter((i) => i.level === 'warning')].map(
    (i) => `  ${i.level === 'error' ? 'ERROR  ' : 'warning'}  content/${i.file}: ${i.message}`
  );
  const summary = `Content check: ${errors.length} error(s), ${issues.length - errors.length} warning(s)`;
  console.warn(`\n${summary}\n${lines.join('\n')}\n`);
  if (failOnError && errors.length) {
    throw new Error(`${summary}. Fix the errors in content/ listed above.`);
  }
}
