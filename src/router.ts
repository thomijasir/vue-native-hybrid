import { createRouter, createWebHashHistory } from "vue-router";
import { HomePage, NotFoundPage, SignUpPage, StoriesPage } from "./pages";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", redirect: "/signup" },
    { path: "/home", name: "home", component: HomePage },
    { path: "/signup", name: "signup", component: SignUpPage },
    { path: "/stories/:story", name: "stories", component: StoriesPage },
    // Any unavailable page falls back to the 404 page.
    { path: "/:pathMatch(.*)*", name: "not-found", component: NotFoundPage },
  ],
});

export default router;
