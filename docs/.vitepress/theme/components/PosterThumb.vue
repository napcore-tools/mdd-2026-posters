<script setup lang="ts">
// A poster's first page at A2 proportions.
// Until preview images exist (phase 3), it draws a stand-in with the poster title.
defineProps<{
  title: string;
}>();
</script>

<template>
  <div class="poster-thumb">
    <div class="stand-in" aria-hidden="true">
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
