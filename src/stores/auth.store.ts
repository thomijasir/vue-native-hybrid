import { computed, ref } from "vue";
import { defineStore } from "pinia";

export interface SampleUser {
  email: string;
}

/**
 * Demonstration-only authentication state.
 *
 * This store does not call an API or persist a real session. Replace it with
 * the application's authentication implementation before using it in
 * production.
 */
export const useAuthStore = defineStore("sampleAuth", () => {
  const user = ref<SampleUser | null>(null);
  const isLoggedIn = computed(() => user.value !== null);

  function signIn(email: string) {
    user.value = { email };
  }

  function signOut() {
    user.value = null;
  }

  return { user, isLoggedIn, signIn, signOut };
});
