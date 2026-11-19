<script setup lang="ts">
// Home page: search box, topic filter and the poster tiles.
// The filter is kept in the URL (?q=...&topic=...) so a filtered view can be shared
// and survives going to a poster and back.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { withBase } from 'vitepress';
import { data as posters, type Poster } from '@/data/posters.data';
import { data as topics } from '@/data/topics.data';
import { createSearch, snippet, type PosterMatch } from '../search';
import PosterThumb from './PosterThumb.vue';

const query = ref('');
const topic = ref('');
const input = ref<HTMLInputElement>();
const topicFilter = ref<HTMLElement>();

const topicLabel = (slug: string) => topics.find((t) => t.slug === slug)?.label ?? slug;
const topicCount = (slug: string) => posters.filter((p) => p.topics.includes(slug)).length;
const shownTopics = topics.filter((t) => topicCount(t.slug) > 0);

const search = createSearch(posters, topics);
const bySlug = new Map(posters.map((p) => [p.slug, p]));

interface Result {
  poster: Poster;
  match?: PosterMatch;
}

/** Posters matching query and topic: by relevance while searching, else by title */
const results = computed<Result[]>(() => {
  const q = query.value.trim();
  const list: Result[] = q
    ? search(q).map((match) => ({ poster: bySlug.get(match.slug)!, match }))
    : posters.map((poster) => ({ poster }));
  return topic.value ? list.filter((r) => r.poster.topics.includes(topic.value)) : list;
});

const filtered = computed(() => query.value.trim() !== '' || topic.value !== '');

/** For a match the tile does not show (keywords, annotation, poster text): where it matched */
function matchSnippet({ poster, match }: Result): string {
  if (!match?.hiddenMatch) return '';
  for (const source of [poster.annotation, poster.keywords.join(', '), poster.email ?? '', poster.text]) {
    const html = snippet(source, match.terms);
    if (html) return html;
  }
  return '';
}

function clearQuery() {
  query.value = '';
  input.value?.focus();
}

function reset() {
  query.value = '';
  topic.value = '';
  input.value?.focus();
}

function toggleTopic(slug: string) {
  topic.value = topic.value === slug ? '' : slug;
}

// Keep the filter in the URL without adding history entries
watch([query, topic], ([q, t]) => {
  const url = new URL(window.location.href);
  if (q.trim()) url.searchParams.set('q', q.trim());
  else url.searchParams.delete('q');
  if (t) url.searchParams.set('topic', t);
  else url.searchParams.delete('topic');
  window.history.replaceState(window.history.state, '', url);
});

// "/" focuses the search box, as on many sites
function onKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null;
  const typing = target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
  if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    input.value?.focus();
  }
}

onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  query.value = params.get('q') ?? '';
  const t = params.get('topic') ?? '';
  topic.value = shownTopics.some((x) => x.slug === t) ? t : '';
  window.addEventListener('keydown', onKeydown);

  // Start in the search box, but only with a mouse or trackpad: on touch devices
  // focusing opens the on-screen keyboard, which would cover the posters
  if (window.matchMedia('(pointer: fine)').matches) input.value?.focus({ preventScroll: true });

  // On phones the topics scroll sideways: bring a preselected topic into view
  nextTick(() => {
    const row = topicFilter.value;
    const active = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (row && active && row.scrollWidth > row.clientWidth) row.scrollLeft = active.offsetLeft - 16;
  });
});

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <div class="poster-browser">
    <div class="filters" role="search">
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2" />
          <path d="m20 20-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <input
          ref="input"
          v-model="query"
          type="search"
          aria-label="Search posters"
          placeholder="Search by title, author, keyword or poster text"
          autocomplete="off"
          spellcheck="false"
          @keydown.esc="query = ''"
        />
        <button v-if="query" type="button" class="clear" aria-label="Clear search" @click="clearQuery">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div ref="topicFilter" class="topic-filter" role="group" aria-label="Filter by topic">
        <button type="button" class="topic-button" :aria-pressed="topic === ''" @click="topic = ''">All topics</button>
        <button
          v-for="t in shownTopics"
          :key="t.slug"
          type="button"
          class="topic-button"
          :aria-pressed="topic === t.slug"
          :title="t.description"
          @click="toggleTopic(t.slug)"
        >
          {{ t.label }} <span class="count">{{ topicCount(t.slug) }}</span>
        </button>
      </div>

      <p class="result-count" aria-live="polite">
        <template v-if="filtered">
          Showing {{ results.length }} of {{ posters.length }} posters
          <button v-if="results.length" type="button" class="link-button" @click="reset">Show all</button>
        </template>
        <template v-else>{{ posters.length }} posters</template>
      </p>
    </div>

    <ul v-if="results.length" class="poster-grid">
      <li v-for="r in results" :key="r.poster.slug">
        <a class="tile" :href="withBase(r.poster.url)">
          <PosterThumb
            :slug="r.poster.slug"
            :title="r.poster.title"
            :has-preview="r.poster.hasPreview"
            sizes="(min-width: 1200px) 260px, (min-width: 960px) 22vw, (min-width: 640px) 30vw, 45vw"
          />
          <span class="tile-body">
            <span class="tile-title">{{ r.poster.title }}</span>
            <span class="tile-authors">{{ r.poster.authors.join(', ') }}</span>
            <!-- snippet() escapes the text and only adds <mark> -->
            <span v-if="matchSnippet(r)" class="tile-snippet" v-html="matchSnippet(r)" />
            <span v-if="r.poster.topics.length" class="tile-topics">
              <span v-for="t in r.poster.topics" :key="t" class="topic" :class="{ active: t === topic }">
                {{ topicLabel(t) }}
              </span>
            </span>
          </span>
        </a>
      </li>
    </ul>

    <div v-else class="empty">
      <p>No posters match your search{{ topic ? ' in this topic' : '' }}.</p>
      <button type="button" class="link-button" @click="reset">Clear search and topic</button>
    </div>
  </div>
</template>

<style scoped>
/* Search and filter */
.filters {
  margin-bottom: 32px;
}

.search-box {
  position: relative;
  max-width: 720px;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 16px;
  width: 20px;
  height: 20px;
  color: var(--vp-c-text-2);
  transform: translateY(-50%);
  pointer-events: none;
}

.search-box input {
  width: 100%;
  height: 52px;
  padding: 0 48px;
  border: 2px solid var(--vp-c-divider);
  border-radius: 26px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 1.05rem;
  transition: border-color 0.2s;
}

.search-box input::placeholder {
  color: var(--vp-c-text-3);
}

.search-box input:hover {
  border-color: var(--vp-c-border);
}

.search-box input:focus {
  border-color: var(--vp-c-brand-1);
  outline: none;
}

/* The clear button below replaces the browser's own */
.search-box input::-webkit-search-cancel-button {
  appearance: none;
}

.clear {
  position: absolute;
  top: 50%;
  right: 10px;
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 50%;
  color: var(--vp-c-text-2);
  transform: translateY(-50%);
}

.clear:hover {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}

.clear svg {
  width: 18px;
  height: 18px;
}

.topic-filter {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.topic-button {
  padding: 4px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
  font-weight: 600;
  transition:
    border-color 0.2s,
    background-color 0.2s,
    color 0.2s;
}

.topic-button:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.topic-button[aria-pressed='true'] {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-1);
  color: var(--napcore-on-brand);
}

.topic-button .count {
  margin-left: 2px;
  opacity: 0.65;
  font-weight: 400;
}

.result-count {
  margin: 16px 0 0;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}

.link-button {
  margin-left: 8px;
  color: var(--vp-c-brand-1);
  font-weight: 600;
  text-decoration: underline;
}

.empty {
  padding: 48px 0;
  color: var(--vp-c-text-2);
  text-align: center;
}

.empty p {
  margin: 0 0 8px;
  font-size: 1.1rem;
}

.empty .link-button {
  margin: 0;
}

/* Tiles */
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

.tile-snippet {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  padding-left: 8px;
  border-left: 3px solid var(--napcore-yellow);
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
  line-height: 1.4;
}

.tile-snippet :deep(mark) {
  padding: 0 1px;
  border-radius: 2px;
  background: rgba(255, 203, 1, 0.45);
  color: var(--vp-c-text-1);
}

.tile-topics {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.topic {
  padding: 0 8px;
  border-radius: 999px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.6;
}

.topic.active {
  background: var(--vp-c-brand-1);
  color: var(--napcore-on-brand);
}

@media (max-width: 639px) {
  .search-box input {
    height: 46px;
    font-size: 1rem;
  }

  /* One row of topics that scrolls sideways, edge to edge, instead of five wrapped rows */
  .topic-filter {
    flex-wrap: nowrap;
    margin: 12px -16px 0;
    padding: 0 16px 4px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .topic-filter::-webkit-scrollbar {
    display: none;
  }

  .topic-button {
    flex-shrink: 0;
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .tile-title {
    font-size: 0.95rem;
  }

  .tile-authors {
    font-size: 0.8rem;
  }
}
</style>
