<script setup lang="ts">
import { RouterLink } from "vue-router";
import { useStoriesController } from "./Stories.controller";
import { SafeAreaLayout } from "~/layouts";
import type { StoryEntry } from "~/layouts/Stories/Stories.interface";

const { query, uiStories, urbStories, hasResults } = useStoriesController();

const categoryBadgeClass = (category: StoryEntry["category"]) =>
  category === "ui"
    ? "bg-primary-50 text-primary"
    : "bg-secondary-50 text-secondary";

const categoryLabel = (category: StoryEntry["category"]) =>
  category === "ui" ? "UI" : "URB";

interface Segment {
  text: string;
  hit: boolean;
}

// Splits text into segments, marking the parts that match the search query
// so they can be wrapped in <mark> for highlighting.
function segments(text: string): Segment[] {
  const q = query.value.trim();
  if (!q) return [{ text, hit: false }];

  const lower = text.toLowerCase();
  const ql = q.toLowerCase();
  const out: Segment[] = [];
  let i = 0;

  while (i <= text.length) {
    const idx = lower.indexOf(ql, i);
    if (idx === -1) {
      out.push({ text: text.slice(i), hit: false });
      break;
    }
    if (idx > i) out.push({ text: text.slice(i, idx), hit: false });
    out.push({ text: text.slice(idx, idx + ql.length), hit: true });
    i = idx + ql.length;
  }
  return out;
}
</script>

<template>
  <SafeAreaLayout>
    <div class="mx-auto w-full max-w-3xl px-4 py-4">
      <h1 class="text-2xl font-bold text-foreground">Stories</h1>
      <p class="mt-1 text-sm text-foreground-muted">
        A read-only catalog of UI components and URB capabilities.
      </p>

      <div class="mt-4">
        <input
          v-model="query"
          type="search"
          placeholder="Search stories…"
          class="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <p
        v-if="!hasResults"
        class="mt-6 text-center text-sm text-foreground-muted">
        No stories match "{{ query }}".
      </p>

      <section v-if="uiStories.length" class="mt-5">
        <h2
          class="text-xs font-semibold tracking-wide text-foreground-subtle uppercase">
          UI components
        </h2>
        <ul class="mt-2 space-y-2">
          <li v-for="story in uiStories" :key="story.id">
            <RouterLink
              :to="`/stories/${story.id}`"
              class="block rounded-sm border border-border bg-surface p-3 transition-colors hover:bg-surface-hover">
              <div class="flex items-center justify-between gap-2">
                <h3 class="font-semibold text-foreground">
                  <template
                    v-for="(seg, i) in segments(story.meta.name)"
                    :key="i">
                    <mark
                      v-if="seg.hit"
                      class="rounded-sm bg-warning-50 px-0.5 text-foreground"
                      >{{ seg.text }}</mark
                    >
                    <span v-else>{{ seg.text }}</span>
                  </template>
                </h3>
                <span
                  :class="`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${categoryBadgeClass(story.category)}`">
                  {{ categoryLabel(story.category) }}
                </span>
              </div>
              <p class="mt-1 line-clamp-2 text-sm text-foreground-muted">
                <template
                  v-for="(seg, i) in segments(story.meta.description)"
                  :key="i">
                  <mark
                    v-if="seg.hit"
                    class="rounded-sm bg-warning-50 px-0.5 text-foreground"
                    >{{ seg.text }}</mark
                  >
                  <span v-else>{{ seg.text }}</span>
                </template>
              </p>
            </RouterLink>
          </li>
        </ul>
      </section>

      <section v-if="urbStories.length" class="mt-5">
        <h2
          class="text-xs font-semibold tracking-wide text-foreground-subtle uppercase">
          URB capabilities
        </h2>
        <ul class="mt-2 space-y-2">
          <li v-for="story in urbStories" :key="story.id">
            <RouterLink
              :to="`/stories/${story.id}`"
              class="block rounded-sm border border-border bg-surface p-3 transition-colors hover:bg-surface-hover">
              <div class="flex items-center justify-between gap-2">
                <h3 class="font-semibold text-foreground">
                  <template
                    v-for="(seg, i) in segments(story.meta.name)"
                    :key="i">
                    <mark
                      v-if="seg.hit"
                      class="rounded-sm bg-warning-50 px-0.5 text-foreground"
                      >{{ seg.text }}</mark
                    >
                    <span v-else>{{ seg.text }}</span>
                  </template>
                </h3>
                <span
                  :class="`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${categoryBadgeClass(story.category)}`">
                  {{ categoryLabel(story.category) }}
                </span>
              </div>
              <p class="mt-1 line-clamp-2 text-sm text-foreground-muted">
                <template
                  v-for="(seg, i) in segments(story.meta.description)"
                  :key="i">
                  <mark
                    v-if="seg.hit"
                    class="rounded-sm bg-warning-50 px-0.5 text-foreground"
                    >{{ seg.text }}</mark
                  >
                  <span v-else>{{ seg.text }}</span>
                </template>
              </p>
            </RouterLink>
          </li>
        </ul>
      </section>
    </div>
  </SafeAreaLayout>
</template>
