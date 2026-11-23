import { defineLoader } from 'vitepress';
import { readPosters, type Poster } from '../core/content.ts';

export type { Poster };

declare const data: Poster[];
export { data };

/**
 * Published posters from content/*.md, sorted by title.
 * Also watches the preview images, so a running dev server shows a preview
 * as soon as `npm run previews` has rendered it.
 */
export default defineLoader({
  watch: ['../../../content/*.md', '../../../content/*.pdf', '../../public/previews/*.jpg'],
  load(files): Poster[] {
    return readPosters(files.filter((f) => f.endsWith('.md')));
  },
});
