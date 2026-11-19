/**
 * Full text search over the posters, in the browser.
 *
 * Every metadata field is searched, plus the text extracted from the PDF. Matches in the
 * title, keywords and authors rank above matches in the poster text. Terms match as
 * prefixes ("datex" finds "DATEX II"), longer terms also with small typos, and accents
 * are ignored ("vlcinsky" finds "Vlčinský"). All terms of a query must match.
 */
import MiniSearch, { type SearchResult } from 'minisearch';
import type { Poster } from '@/data/posters.data';
import type { Topic } from '@/data/topics.data';

interface SearchDoc {
  slug: string;
  title: string;
  authors: string;
  keywords: string;
  topics: string;
  annotation: string;
  email: string;
  text: string;
}

/** Fields whose match is visible on a tile; a match only elsewhere gets a text snippet */
const VISIBLE_FIELDS = new Set(['title', 'authors', 'topics']);

/** Lower case without accents: "Vlčinský" -> "vlcinsky" */
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export interface PosterMatch {
  slug: string;
  /** Terms of the poster that matched the query, for highlighting */
  terms: string[];
  /** Whether only fields not shown on the tile matched (annotation, keywords, poster text, ...) */
  hiddenMatch: boolean;
}

export function createSearch(posters: Poster[], topics: Topic[]) {
  const topicLabel = (slug: string) => topics.find((t) => t.slug === slug)?.label ?? slug;

  const index = new MiniSearch<SearchDoc>({
    idField: 'slug',
    fields: ['title', 'authors', 'keywords', 'topics', 'annotation', 'email', 'text'],
    processTerm: (term) => fold(term),
    searchOptions: {
      boost: { title: 4, keywords: 3, authors: 3, topics: 2, annotation: 2, email: 1, text: 1 },
      prefix: true,
      fuzzy: (term) => (term.length > 4 ? 0.2 : false),
      combineWith: 'AND',
    },
  });

  index.addAll(
    posters.map((p) => ({
      slug: p.slug,
      title: p.title,
      authors: p.authors.join(', '),
      keywords: p.keywords.join(', '),
      topics: p.topics.map(topicLabel).join(', '),
      annotation: p.annotation,
      email: p.email ?? '',
      text: p.text,
    }))
  );

  /** Posters matching the query, best match first */
  return function search(query: string): PosterMatch[] {
    return index.search(query.trim()).map((r: SearchResult) => {
      const fields = new Set(Object.values(r.match).flat());
      return {
        slug: String(r.id),
        terms: r.terms,
        hiddenMatch: ![...fields].some((f) => VISIBLE_FIELDS.has(f)),
      };
    });
  };
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/**
 * A short excerpt of `text` around the first matched term, as HTML with the matched
 * terms in <mark>. Empty if no term is found in the text.
 */
export function snippet(text: string, terms: string[], radius = 70): string {
  if (!terms.length) return '';
  // Search on the folded text; folding keeps the string length for the scripts used here,
  // so positions map back to the original text
  const folded = fold(text);
  if (folded.length !== text.length) return '';
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gu'
  );

  const first = pattern.exec(folded);
  if (!first) return '';

  // Cut at word boundaries around the first match
  let start = Math.max(0, first.index - radius);
  let end = Math.min(text.length, first.index + first[0].length + radius);
  if (start > 0) start = text.indexOf(' ', start) + 1 || start;
  if (end < text.length) end = text.lastIndexOf(' ', end) > first.index ? text.lastIndexOf(' ', end) : end;

  let html = '';
  let pos = start;
  pattern.lastIndex = start;
  for (let m = pattern.exec(folded); m && m.index < end; m = pattern.exec(folded)) {
    const matchEnd = Math.min(m.index + m[0].length, end);
    html += escapeHtml(text.slice(pos, m.index)) + '<mark>' + escapeHtml(text.slice(m.index, matchEnd)) + '</mark>';
    pos = matchEnd;
  }
  html += escapeHtml(text.slice(pos, end));
  return (start > 0 ? '… ' : '') + html + (end < text.length ? ' …' : '');
}
