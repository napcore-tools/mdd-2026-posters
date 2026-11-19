<script setup lang="ts">
// A poster's first page at A2 proportions, from the images rendered by scripts/build-previews.mjs.
// Without a preview (missing or failed to load) it draws a stand-in with the poster title.
import { ref } from 'vue';
import { withBase } from 'vitepress';

const props = withDefaults(
  defineProps<{
    slug: string;
    title: string;
    hasPreview: boolean;
    /** The `sizes` attribute: rendered width of the image at each breakpoint */
    sizes: string;
    /** Text alternative; empty when the title is shown next to the image */
    alt?: string;
    /** Load lazily (tiles) or right away (poster page) */
    lazy?: boolean;
  }>(),
  { alt: '', lazy: true }
);

const failed = ref(false);
const src = (width: number) => withBase(`/previews/${props.slug}-${width}.jpg`);
</script>

<template>
  <div class="poster-thumb">
    <img
      v-if="hasPreview && !failed"
      :src="src(600)"
      :srcset="`${src(600)} 600w, ${src(1200)} 1200w`"
      :sizes="sizes"
      :alt="alt"
      width="600"
      height="849"
      :loading="lazy ? 'lazy' : 'eager'"
      decoding="async"
      @error="failed = true"
    />
    <div v-else class="stand-in" aria-hidden="true">
      <span class="stand-in-title">{{ title }}</span>
    </div>
  </div>
</template>

<style scoped>
.poster-thumb {
  position: relative;
  container-type: inline-size;
  /* A-series paper: height = width × √2 */
  aspect-ratio: 1 / 1.4142;
  overflow: hidden;
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  box-shadow: 0 1px 4px var(--napcore-shadow);
}

/* A thin outline keeps white posters apart from the white page */
.poster-thumb::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: inherit;
  pointer-events: none;
}

img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
}

.stand-in {
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: flex-start;
  padding: 12% 10%;
  background:
    linear-gradient(var(--napcore-yellow), var(--napcore-yellow)) bottom / 100% 4% no-repeat,
    linear-gradient(160deg, var(--napcore-navy) 0%, var(--napcore-navy-dark) 100%);
}

.stand-in-title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 6;
  color: #fff;
  font-size: clamp(0.8rem, 7cqi, 1.75rem);
  font-weight: 700;
  line-height: 1.25;
}
</style>
