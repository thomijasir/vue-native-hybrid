import type { Ref } from "vue";
import { useWebStorage } from "./useWebStorage";

/**
 * Creates a reactive value that is restored from and persisted to
 * `window.localStorage`.
 *
 * Stored values use JSON serialization. If the key does not exist, contains
 * invalid JSON, or local storage is unavailable, the composable starts with
 * `defaultValue`. Changes to nested objects and arrays are persisted too. A
 * value that serializes to `undefined` removes the key.
 *
 * @typeParam T - The type of the persisted value.
 * @param key - The local storage key used to read and persist the value.
 * @param defaultValue - The value used when no valid stored value is available.
 * @returns A Vue ref whose changes are automatically persisted.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useLocalStorage } from "~/composables";
 *
 * interface Preferences {
 *   theme: "light" | "dark";
 *   notificationsEnabled: boolean;
 * }
 *
 * const preferences = useLocalStorage<Preferences>("preferences", {
 *   theme: "light",
 *   notificationsEnabled: true,
 * });
 *
 * function toggleTheme() {
 *   preferences.value.theme =
 *     preferences.value.theme === "light" ? "dark" : "light";
 * }
 * </script>
 *
 * <template>
 *   <button type="button" @click="toggleTheme">
 *     Use {{ preferences.theme }} theme
 *   </button>
 * </template>
 * ```
 */
export function useLocalStorage<T>(key: string, defaultValue: T): Ref<T> {
  return useWebStorage(
    () => (typeof window === "undefined" ? undefined : window.localStorage),
    key,
    defaultValue,
  );
}
