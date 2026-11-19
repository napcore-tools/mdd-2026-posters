import { h } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import '@fontsource/titillium-web/400.css';
import '@fontsource/titillium-web/600.css';
import '@fontsource/titillium-web/700.css';
import './napcore-theme.css';
import './custom.css';
import PosterHeader from './components/PosterHeader.vue';
import PosterList from './components/PosterList.vue';

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      // Metadata block on top of every poster page
      'doc-before': () => h(PosterHeader),
    }),
  enhanceApp({ app }) {
    app.component('PosterList', PosterList);
  },
} satisfies Theme;
