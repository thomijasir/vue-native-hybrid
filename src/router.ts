import { createRouter, createWebHashHistory } from "vue-router";
import { HomePage, NotFoundPage, SignInPage, SignUpPage } from "./pages";
import { StoriesRoute } from "./pages/Stories/Stories.route";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", redirect: "/home" },
    { path: "/home", name: "home", component: HomePage },
    { path: "/signin", name: "signin", component: SignInPage },
    { path: "/signup", name: "signup", component: SignUpPage },
    ...StoriesRoute,
    // Any unavailable page falls back to the 404 page.
    { path: "/:pathMatch(.*)*", name: "not-found", component: NotFoundPage },
  ],
});

export default router;
