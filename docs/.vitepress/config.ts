import { defineConfig } from 'vitepress';
import { fileURLToPath, URL } from 'node:url';

// GitHub Pages serves the site from /mdd-2026-posters/; the deploy workflow sets VITEPRESS_BASE.
// Locally the site runs at the root.
const BASE_PATH = process.env.VITEPRESS_BASE || '/';

// VitePress does not add the base to `head` tags or to HTML in the footer
const withBase = (url: string) => BASE_PATH.replace(/\/+$/, '') + url;

const REPO_URL = 'https://github.com/napcore-tools/mdd-2026-posters';

export default defineConfig({
  title: 'MDD 2026 Posters',
  description: 'Poster Corner of the NAPCORE Mobility Data Days 2026 in Athens',
  lang: 'en-GB',
  base: BASE_PATH,
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: withBase('/favicon.png') }],
    ['meta', { name: 'theme-color', content: '#ffcb01' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'MDD 2026 Posters' }],
    ['meta', { property: 'og:description', content: 'Poster Corner of the NAPCORE Mobility Data Days 2026 in Athens' }],
  ],

  // Poster pages: one column, no "On this page" outline
  transformPageData(pageData) {
    if (pageData.relativePath.startsWith('posters/')) {
      pageData.frontmatter.aside = false;
      pageData.frontmatter.outline = false;
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
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url)),
      },
    },
  },
});
