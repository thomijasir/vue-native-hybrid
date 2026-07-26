import { ref } from "vue";
import type { HomeState } from "./Home.interface";

export function useHomeController() {
  const title = ref<HomeState["title"]>("Welcome to referror pay");
  return { title };
}
