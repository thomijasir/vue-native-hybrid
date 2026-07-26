import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { stories } from "./components";
import type { StoryEntry } from "~/layouts/Stories/Stories.interface";

export function useStoryDetailController() {
  const route = useRoute();
  const router = useRouter();

  const storyId = computed(() => String(route.params.story ?? ""));

  const entry = computed<StoryEntry | undefined>(() =>
    stories.find((story) => story.id === storyId.value),
  );

  // Unknown id — bounce back to the list rather than rendering an empty page.
  watch(
    entry,
    (value) => {
      if (!value) {
        router.replace("/stories");
      }
    },
    { immediate: true },
  );

  return { entry };
}
