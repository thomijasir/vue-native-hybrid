import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "~/stores/auth.store";
import type { SignInState } from "./SignIn.interface";

export function useSignInController() {
  const router = useRouter();
  const authStore = useAuthStore();
  const email = ref<SignInState["email"]>("");
  const password = ref<SignInState["password"]>("");
  const error = ref("");

  async function onSubmit() {
    error.value = "";

    if (!email.value.trim() || !password.value) {
      error.value = "Enter an email and password to continue.";
      return;
    }

    authStore.signIn(email.value.trim());
    await router.push("/home");
  }

  return { email, password, error, onSubmit };
}
