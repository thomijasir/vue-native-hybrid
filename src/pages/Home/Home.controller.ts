import { storeToRefs } from "pinia";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "~/stores/auth.store";
import type { HomeState } from "./Home.interface";

export function useHomeController() {
  const router = useRouter();
  const title = ref<HomeState["title"]>("Welcome to referror pay");
  const authStore = useAuthStore();
  const { isLoggedIn, user } = storeToRefs(authStore);

  function goToSignIn() {
    return router.push("/signin");
  }

  return {
    title,
    isLoggedIn,
    user,
    goToSignIn,
    signOut: authStore.signOut,
  };
}
