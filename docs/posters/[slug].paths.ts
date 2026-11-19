// One page per published poster in content/. The page has no Markdown content of its own:
// PosterLayout renders it from the posters data, and the poster text is used for search only.
import { readPosters } from '../.vitepress/core/content.ts';

export default {
  watch: ['../../content/*.md'],
  paths(files: string[]) {
    return readPosters(files).map((p) => ({
      params: { slug: p.slug, title: p.title, description: p.annotation, hasPreview: p.hasPreview },
    }));
  },
};
