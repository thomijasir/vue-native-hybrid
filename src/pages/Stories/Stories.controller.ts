import { computed, ref } from "vue";
import { stories } from "./components";
import type { StoryEntry } from "~/layouts/Stories/Stories.interface";

export function useStoriesController() {
  const query = ref("");

  const filtered = computed<StoryEntry[]>(() => {
    const q = query.value.trim().toLowerCase();
    if (!q) return stories;
    return stories.filter(
      (story) =>
        story.meta.name.toLowerCase().includes(q) ||
        story.meta.description.toLowerCase().includes(q),
    );
  });

  const uiStories = computed(() =>
    filtered.value.filter((story) => story.category === "ui"),
  );

  const urbStories = computed(() =>
    filtered.value.filter((story) => story.category === "urb"),
  );

  const hasResults = computed(
    () => uiStories.value.length > 0 || urbStories.value.length > 0,
  );

  return { query, uiStories, urbStories, hasResults };
}
