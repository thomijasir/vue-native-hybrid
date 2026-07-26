import { ref } from "vue";
import type { SignUpState } from "./SignUp.interface";

export function useSignUpController() {
  const email = ref<SignUpState["email"]>("");
  const password = ref<SignUpState["password"]>("");

  function onSubmit() {
    // Placeholder for signup submission logic.
    console.log("signup", { email: email.value, password: password.value });
  }

  return { email, password, onSubmit };
}
