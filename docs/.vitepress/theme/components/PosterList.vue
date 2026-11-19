<script setup lang="ts">
// Phase 1: plain list of posters. Becomes the tile grid with search and topic filter in phases 2 and 4.
import { withBase } from 'vitepress';
import { data as posters } from '@/data/posters.data';
</script>

<template>
  <ul class="poster-list">
    <li v-for="p in posters" :key="p.slug">
      <a :href="withBase(p.url)">{{ p.title }}</a>
      <span class="authors">{{ p.authors }}</span>
    </li>
  </ul>
</template>

<style scoped>
.poster-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.poster-list li {
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.poster-list a {
  display: block;
  color: var(--vp-c-brand-1);
  font-size: 1.1rem;
  font-weight: 700;
  text-decoration: none;
}

.poster-list a:hover {
  text-decoration: underline;
}

.authors {
  color: var(--vp-c-text-2);
}
</style>
