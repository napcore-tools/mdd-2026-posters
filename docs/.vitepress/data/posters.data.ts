import { createContentLoader } from 'vitepress';

/** One poster, read from the front matter of docs/posters/<slug>.md */
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
}

declare const data: Poster[];
export { data };

const asList = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);

export default createContentLoader('posters/*.md', {
  transform(pages): Poster[] {
    return pages
      .map(({ url, frontmatter: fm }) => ({
        slug: url.replace(/^.*\//, ''),
        status: String(fm.status ?? ''),
        title: String(fm.title ?? ''),
        authors: String(fm.authors ?? ''),
        topics: asList(fm.topics),
        keywords: asList(fm.keywords),
        annotation: String(fm.annotation ?? ''),
        email: fm.email ? String(fm.email) : undefined,
        url,
      }))
      .sort((a, b) => a.title.localeCompare(b.title, 'en'));
  },
});
