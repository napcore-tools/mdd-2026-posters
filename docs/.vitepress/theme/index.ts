import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import '@fontsource/titillium-web/400.css';
import '@fontsource/titillium-web/600.css';
import '@fontsource/titillium-web/700.css';
import './napcore-theme.css';
import './custom.css';
import PosterGrid from './components/PosterGrid.vue';
import PosterLayout from './components/PosterLayout.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('PosterGrid', PosterGrid);
    // Used as a layout name: config.ts sets `layout: PosterLayout` on every poster page
    app.component('PosterLayout', PosterLayout);
  },
} satisfies Theme;
