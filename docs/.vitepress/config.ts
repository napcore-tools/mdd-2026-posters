import { defineConfig, type Plugin } from 'vitepress';
import { copyFileSync, createReadStream, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { CONTENT_DIR, readPosters } from './core/content.ts';
import { reportIssues, validateContent } from './core/validation.ts';

// Check content/ when the config loads: `vitepress build` stops on errors,
// the dev server only reports them so content can be fixed while it runs
reportIssues(validateContent(), { failOnError: process.argv.includes('build') });

// GitHub Pages serves the site from /mdd-2026-posters/; the deploy workflow sets VITEPRESS_BASE.
// Locally the site runs at the root.
const BASE_PATH = process.env.VITEPRESS_BASE || '/';

// VitePress does not add the base to `head` tags or to HTML in the footer
const withBase = (url: string) => BASE_PATH.replace(/\/+$/, '') + url;

// Public address of the site, for absolute URLs in link previews (og:image needs one).
// The deploy workflow sets SITE_URL when the repository has a custom domain.
const SITE_URL = (process.env.SITE_URL || 'https://napcore-tools.github.io/mdd-2026-posters').replace(/\/+$/, '');

const SITE_TITLE = 'MDD 2026 Posters';
const REPO_URL = 'https://github.com/napcore-tools/mdd-2026-posters';
const DESCRIPTION = 'Poster Corner of the NAPCORE Mobility Data Days 2026 in Athens';

/** Dev server: serves content/<slug>.pdf at /posters/<slug>.pdf (the build copies them in buildEnd) */
function posterPdfs(): Plugin {
  return {
    name: 'mdd-poster-pdfs',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const match = req.url?.match(/\/posters\/([a-z0-9-]+)\.pdf(?:\?.*)?$/);
        const file = match && join(CONTENT_DIR, `${match[1]}.pdf`);
        if (!file || !existsSync(file)) return next();
        res.setHeader('Content-Type', 'application/pdf');
        createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  title: SITE_TITLE,
  description: DESCRIPTION,
  lang: 'en-GB',
  base: BASE_PATH,
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: withBase('/favicon.png') }],
    ['meta', { name: 'theme-color', content: '#ffcb01' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: SITE_TITLE }],
  ],

  // Poster pages come from the dynamic route docs/posters/[slug].md. They use the
  // PosterLayout component (registered in theme/index.ts) and take title and
  // description from the route params.
  // Every page gets link preview tags; poster pages show the poster as the image.
  transformPageData(pageData) {
    const params = pageData.params;
    if (pageData.relativePath.startsWith('posters/')) {
      pageData.frontmatter.layout = 'PosterLayout';
      if (params?.title) pageData.title = params.title;
      if (params?.description) pageData.description = params.description;
    }
    pageData.frontmatter.head ??= [];
    pageData.frontmatter.head.push(
      ['meta', { property: 'og:title', content: pageData.title || SITE_TITLE }],
      ['meta', { property: 'og:description', content: pageData.description || DESCRIPTION }]
    );
    if (params?.slug && params.hasPreview) {
      pageData.frontmatter.head.push(
        ['meta', { property: 'og:image', content: `${SITE_URL}/previews/${params.slug}-1200.jpg` }],
        ['meta', { name: 'twitter:card', content: 'summary_large_image' }]
      );
    }
  },

  // Publish the PDFs of published posters at /posters/<slug>.pdf
  buildEnd(siteConfig) {
    const outDir = join(siteConfig.outDir, 'posters');
    mkdirSync(outDir, { recursive: true });
    for (const { slug } of readPosters()) {
      const pdf = join(CONTENT_DIR, `${slug}.pdf`);
      if (existsSync(pdf)) copyFileSync(pdf, join(outDir, `${slug}.pdf`));
      else console.warn(`[posters] content/${slug}.pdf is missing`);
    }
  },

  themeConfig: {
    logo: { light: '/napcore-logo-navy.png', dark: '/napcore-logo-dark.png' },

    nav: [{ text: 'Posters', link: '/' }],

    socialLinks: [{ icon: 'github', link: REPO_URL }],

    footer: {
      message:
        `<img class="eu-emblem eu-emblem-light" src="${withBase('/eu-co-funded.png')}" width="251" height="56" alt="Co-funded by the European Union">` +
        `<img class="eu-emblem eu-emblem-dark" src="${withBase('/eu-co-funded-dark.png')}" width="251" height="56" alt="Co-funded by the European Union">` +
        '<span class="eu-programme">Connecting Europe Facility</span>',
      copyright:
        'Copyright © 2026 <a href="https://napcore.eu" target="_blank" rel="noopener">NAPCORE</a> - National Access Point Coordination Organisation for Europe',
    },

    docFooter: { prev: false, next: false },
  },

  vite: {
    plugins: [posterPdfs()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url)),
      },
    },
  },
});
