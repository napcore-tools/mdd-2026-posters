import { defineLoader } from 'vitepress';
import { readTopics, type Topic } from '../core/content.ts';

export type { Topic };

declare const data: Topic[];
export { data };

/** Predefined topics from content/topics.csv, in file order */
export default defineLoader({
  watch: ['../../../content/topics.csv'],
  load(files): Topic[] {
    return files.length ? readTopics(files[0]) : [];
  },
});
