<script setup lang="ts">
// Layout of a poster page (dynamic route docs/posters/[slug].md); config.ts assigns it.
// Everything shown comes from the posters data loader (front matter of content/<slug>.md).
// The Markdown body of a poster is text extracted from the PDF and is used for search only.
import { computed } from 'vue';
import { useData, withBase } from 'vitepress';
import { data as posters } from '@/data/posters.data';
import { data as topics } from '@/data/topics.data';
import PosterThumb from './PosterThumb.vue';

const { page } = useData();

const slug = computed(() => page.value.relativePath.replace(/^posters\//, '').replace(/\.md$/, ''));
const index = computed(() => posters.findIndex((p) => p.slug === slug.value));
const poster = computed(() => posters[index.value]);
const prev = computed(() => (index.value > 0 ? posters[index.value - 1] : undefined));
const next = computed(() => (index.value >= 0 ? posters[index.value + 1] : undefined));

const topicLabel = (slug: string) => topics.find((t) => t.slug === slug)?.label ?? slug;

const pdfUrl = computed(() => withBase(`/posters/${slug.value}.pdf`));

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} kB`;
}
</script>

<template>
  <div class="poster-page">
    <p class="back"><a :href="withBase('/')">&larr; All posters</a></p>

    <p v-if="!poster" class="unpublished">This poster is not published.</p>

    <article v-else class="poster">
      <header class="poster-head">
        <h1>{{ poster.title }}</h1>
        <p class="authors">{{ poster.authors.join(', ') }}</p>
      </header>

      <a class="poster-preview" :href="pdfUrl" target="_blank" rel="noopener" :aria-label="`Open the poster as PDF`">
        <PosterThumb
          :slug="poster.slug"
          :title="poster.title"
          :has-preview="poster.hasPreview"
          sizes="(min-width: 1200px) 425px, (min-width: 768px) 36vw, 280px"
          :lazy="false"
        />
      </a>

      <div class="poster-meta">
        <p class="annotation">{{ poster.annotation }}</p>

        <dl>
          <template v-if="poster.topics.length">
            <dt>Topics</dt>
            <dd>
              <ul class="chips">
                <li v-for="t in poster.topics" :key="t">
                  <a class="topic-link" :href="withBase(`/?topic=${t}`)" :title="`All posters on ${topicLabel(t)}`">
                    {{ topicLabel(t) }}
                  </a>
                </li>
              </ul>
            </dd>
          </template>
          <template v-if="poster.keywords.length">
            <dt>Keywords</dt>
            <dd>
              <ul class="chips chips-plain">
                <li v-for="k in poster.keywords" :key="k">{{ k }}</li>
              </ul>
            </dd>
          </template>
          <template v-if="poster.email">
            <dt>Contact</dt>
            <dd>
              <a :href="`mailto:${poster.email}`">{{ poster.email }}</a>
            </dd>
          </template>
        </dl>

        <div class="actions">
          <a class="btn brand" :href="pdfUrl" target="_blank" rel="noopener">Open PDF</a>
          <a class="btn alt" :href="pdfUrl" :download="`${slug}.pdf`">
            Download PDF<span v-if="poster.pdfSize" class="size"> ({{ formatSize(poster.pdfSize) }})</span>
          </a>
        </div>
      </div>
    </article>

    <nav v-if="poster" class="pager" aria-label="Other posters">
      <a v-if="prev" class="pager-link prev" :href="withBase(prev.url)">
        <span class="pager-label">Previous poster</span>
        <span class="pager-title">{{ prev.title }}</span>
      </a>
      <a v-if="next" class="pager-link next" :href="withBase(next.url)">
        <span class="pager-label">Next poster</span>
        <span class="pager-title">{{ next.title }}</span>
      </a>
    </nav>
  </div>
</template>

<style scoped>
.poster-page {
  max-width: 1152px;
  margin: 0 auto;
  padding: 24px 24px 64px;
}

.back {
  margin: 0 0 16px;
  font-weight: 600;
}

.back a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.back a:hover {
  text-decoration: underline;
}

/* Small screens: title, preview, details. Wide screens: preview on the left. */
.poster {
  display: grid;
  grid-template-areas:
    'head'
    'preview'
    'meta';
  gap: 24px;
}

@media (min-width: 768px) {
  .poster {
    grid-template-areas:
      'preview head'
      'preview meta';
    grid-template-columns: minmax(240px, 2fr) 3fr;
    grid-template-rows: auto 1fr;
    column-gap: 48px;
    row-gap: 16px;
  }
}

.poster-head {
  grid-area: head;
}

.poster-preview {
  grid-area: preview;
  align-self: start;
  width: 100%;
  /* On phones keep the preview small so the summary is not pushed off the first screen */
  max-width: 280px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .poster-preview {
    position: sticky;
    top: calc(var(--vp-nav-height) + 24px);
    max-width: none;
  }
}

.poster-meta {
  grid-area: meta;
  min-width: 0;
}

h1 {
  margin: 0 0 8px;
  color: var(--napcore-heading);
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.25;
}

.authors {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 1.1rem;
  font-weight: 600;
}

.annotation {
  margin: 0 0 24px;
  font-size: 1.1rem;
  line-height: 1.7;
}

dl {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 12px 16px;
  margin: 0 0 28px;
}

dt {
  padding-top: 2px;
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

dd {
  margin: 0;
}

dd a {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.chips li {
  padding: 1px 10px;
  border-radius: 999px;
  background: var(--vp-c-brand-1);
  color: var(--napcore-on-brand);
  font-size: 0.85rem;
  font-weight: 600;
}

/* Topic chips link to the home page filtered by that topic */
.chips .topic-link {
  color: inherit;
  text-decoration: none;
}

.chips li:has(.topic-link):hover {
  background: var(--vp-c-brand-2);
}

.chips-plain li {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
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

.btn .size {
  font-weight: 600;
  text-transform: none;
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

.unpublished {
  color: var(--vp-c-text-2);
}

/* Previous / next poster */
.pager {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--vp-c-divider);
}

.pager-link {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  text-decoration: none;
  transition: border-color 0.25s;
}

.pager-link:hover {
  border-color: var(--vp-c-brand-1);
}

.pager-link.next {
  grid-column: 2;
  text-align: right;
}

.pager-label {
  color: var(--vp-c-text-2);
  font-size: 0.8rem;
  font-weight: 600;
}

.pager-title {
  color: var(--vp-c-brand-1);
  font-weight: 700;
  line-height: 1.3;
}

@media (max-width: 639px) {
  .poster-page {
    padding: 16px 16px 48px;
  }

  h1 {
    font-size: 1.6rem;
  }

  .pager {
    grid-template-columns: 1fr;
  }

  .pager-link.next {
    grid-column: 1;
  }
}
</style>
