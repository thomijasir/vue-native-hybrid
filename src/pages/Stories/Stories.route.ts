import StoriesPage from "./Stories.page.vue";
import StoryDetailPage from "./StoryDetail.page.vue";

export const StoriesRoute = [
  { path: "/stories", name: "stories", component: StoriesPage },
  {
    path: "/stories/:story",
    name: "story-detail",
    component: StoryDetailPage,
  },
];
