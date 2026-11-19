<script setup lang="ts">
// Metadata block at the top of a poster page (docs/posters/<slug>.md).
// Phase 1: plain metadata and PDF links. The full detail layout with preview follows in phase 2/3.
import { computed } from 'vue';
import { useData, withBase } from 'vitepress';

const { page, frontmatter } = useData();

const isPoster = computed(() => page.value.relativePath.startsWith('posters/'));
const slug = computed(() => page.value.relativePath.replace(/^posters\//, '').replace(/\.md$/, ''));
const pdfUrl = computed(() => withBase(`/posters/${slug.value}.pdf`));
const keywords = computed<string[]>(() =>
  Array.isArray(frontmatter.value.keywords) ? frontmatter.value.keywords : []
);
</script>

<template>
  <header v-if="isPoster" class="poster-header">
    <p class="back"><a :href="withBase('/')">&larr; All posters</a></p>
    <h1>{{ frontmatter.title }}</h1>
    <p class="authors">{{ frontmatter.authors }}</p>

    <p class="annotation">{{ frontmatter.annotation }}</p>

    <ul v-if="keywords.length" class="keywords" aria-label="Keywords">
      <li v-for="k in keywords" :key="k">{{ k }}</li>
    </ul>

    <p v-if="frontmatter.email" class="contact">
      Contact: <a :href="`mailto:${frontmatter.email}`">{{ frontmatter.email }}</a>
    </p>

    <div class="actions">
      <a class="btn brand" :href="pdfUrl" target="_blank" rel="noopener">Open PDF</a>
      <a class="btn alt" :href="pdfUrl" :download="`${slug}.pdf`">Download PDF</a>
    </div>
  </header>
</template>

<style scoped>
.poster-header h1 {
  margin: 0.25rem 0 0.5rem;
  color: var(--napcore-heading);
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.25;
}

.back {
  margin: 0;
  font-weight: 600;
}

.back a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.authors {
  margin: 0 0 1.25rem;
  color: var(--vp-c-text-2);
  font-size: 1.1rem;
  font-weight: 600;
}

.annotation {
  margin: 0 0 1rem;
  font-size: 1.05rem;
  line-height: 1.7;
}

.keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0 0 1rem;
  padding: 0;
  list-style: none;
}

.keywords li {
  padding: 0.1rem 0.6rem;
  border-radius: 999px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 0.85rem;
  font-weight: 600;
}

.contact {
  margin: 0 0 1.5rem;
}

.contact a {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.btn {
  display: inline-block;
  padding: 0 20px;
  border: 1px solid transparent;
  border-radius: 20px;
  font-weight: 700;
  line-height: 38px;
  letter-spacing: 0.03em;
  text-decoration: none;
  text-transform: uppercase;
  transition:
    background-color 0.25s,
    color 0.25s,
    border-color 0.25s;
}

.btn.brand {
  background: var(--vp-button-brand-bg);
  color: var(--vp-button-brand-text);
}

.btn.brand:hover {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-button-brand-hover-bg);
  color: var(--vp-button-brand-hover-text);
}

.btn.alt {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.btn.alt:hover {
  background: var(--vp-c-brand-1);
  color: var(--napcore-on-brand);
}
</style>
