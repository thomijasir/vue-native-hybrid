import type { Ref } from "vue";
import { useWebStorage } from "./useWebStorage";

/**
 * Creates a reactive value that is restored from and persisted to
 * `window.sessionStorage`.
 *
 * Stored values use JSON serialization. If the key does not exist, contains
 * invalid JSON, or session storage is unavailable, the composable starts with
 * `defaultValue`. Changes to nested objects and arrays are persisted too. A
 * value that serializes to `undefined` removes the key.
 *
 * Session storage is scoped to the current browser tab and is cleared when
 * that tab or window is closed.
 *
 * @typeParam T - The type of the persisted value.
 * @param key - The session storage key used to read and persist the value.
 * @param defaultValue - The value used when no valid stored value is available.
 * @returns A Vue ref whose changes are automatically persisted.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useSessionStorage } from "~/composables";
 *
 * const currentStep = useSessionStorage("checkout-step", 1);
 *
 * function continueCheckout() {
 *   currentStep.value += 1;
 * }
 * </script>
 *
 * <template>
 *   <button type="button" @click="continueCheckout">
 *     Continue from step {{ currentStep }}
 *   </button>
 * </template>
 * ```
 */
export function useSessionStorage<T>(key: string, defaultValue: T): Ref<T> {
  return useWebStorage(
    () => (typeof window === "undefined" ? undefined : window.sessionStorage),
    key,
    defaultValue,
  );
}
