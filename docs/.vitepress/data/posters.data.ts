import { defineLoader } from 'vitepress';
import { readPosters, type Poster } from '../core/content.ts';

export type { Poster };

declare const data: Poster[];
export { data };

/** Published posters from content/*.md, sorted by title */
export default defineLoader({
  watch: ['../../../content/*.md', '../../../content/*.pdf'],
  load(files): Poster[] {
    return readPosters(files.filter((f) => f.endsWith('.md')));
  },
});
