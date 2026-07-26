import type { Component } from "vue";
import type {
  StoryCategory,
  StoryEntry,
  StoriesLayoutProps,
} from "~/layouts/Stories/Stories.interface";

type StoryModule = {
  default: Component;
  story: StoriesLayoutProps;
};

const modules = import.meta.glob<StoryModule>("./*.story.vue", {
  eager: true,
});

const kebabCase = (value: string): string =>
  value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

const parseCategory = (segment: string): StoryCategory => {
  if (segment === "ui" || segment === "urb") {
    return segment;
  }
  throw new Error(
    `Story file must be named "<Name>.ui.story.vue" or "<Name>.urb.story.vue" (got ".${segment}.story.vue")`,
  );
};

const stories: StoryEntry[] = Object.entries(modules).map(([path, module]) => {
  // `./Button.ui.story.vue` -> ["Button", "ui", "story", "vue"]
  const parts = path.replace(/^\.\//, "").split(".");
  const componentName = parts[0];
  const category = parseCategory(parts[1]);

  return {
    id: kebabCase(componentName),
    category,
    component: module.default,
    meta: module.story,
  };
});

export { stories };
