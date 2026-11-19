<script setup lang="ts">
// Home page: all posters as tiles. Search and topic filter are added on top in phase 4.
import { withBase } from 'vitepress';
import { data as posters } from '@/data/posters.data';
import PosterThumb from './PosterThumb.vue';
</script>

<template>
  <ul class="poster-grid">
    <li v-for="p in posters" :key="p.slug">
      <a class="tile" :href="withBase(p.url)">
        <PosterThumb :title="p.title" />
        <span class="tile-body">
          <span class="tile-title">{{ p.title }}</span>
          <span class="tile-authors">{{ p.authors }}</span>
        </span>
      </a>
    </li>
  </ul>
</template>

<style scoped>
.poster-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

@media (min-width: 640px) {
  .poster-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 32px 24px;
  }
}

@media (min-width: 960px) {
  .poster-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.tile {
  display: flex;
  height: 100%;
  flex-direction: column;
  gap: 12px;
  color: inherit;
  text-decoration: none;
}

.tile :deep(.poster-thumb) {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.tile:hover :deep(.poster-thumb),
.tile:focus-visible :deep(.poster-thumb) {
  transform: translateY(-4px);
  box-shadow: 0 10px 24px var(--napcore-shadow);
}

.tile:focus-visible {
  outline: none;
}

.tile:focus-visible .tile-title {
  text-decoration: underline;
}

.tile-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tile-title {
  color: var(--napcore-heading);
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.3;
}

.tile:hover .tile-title {
  color: var(--vp-c-brand-2);
}

.tile-authors {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  line-height: 1.4;
}

@media (max-width: 639px) {
  .tile-title {
    font-size: 0.95rem;
  }

  .tile-authors {
    font-size: 0.8rem;
  }
}
</style>
