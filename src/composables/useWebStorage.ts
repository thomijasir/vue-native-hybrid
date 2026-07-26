import { ref, watch, type Ref } from "vue";

type StorageProvider = () => Storage | undefined;

const readStoredValue = <T>(
  storageProvider: StorageProvider,
  key: string,
  defaultValue: T,
): T => {
  try {
    const storedValue = storageProvider()?.getItem(key);
    return storedValue == null ? defaultValue : (JSON.parse(storedValue) as T);
  } catch {
    return defaultValue;
  }
};

export function useWebStorage<T>(
  storageProvider: StorageProvider,
  key: string,
  defaultValue: T,
): Ref<T> {
  const value = ref(
    readStoredValue(storageProvider, key, defaultValue),
  ) as Ref<T>;

  watch(
    value,
    (nextValue) => {
      try {
        const storage = storageProvider();
        if (!storage) return;

        const serializedValue = JSON.stringify(nextValue);

        if (serializedValue === undefined) {
          storage.removeItem(key);
        } else {
          storage.setItem(key, serializedValue);
        }
      } catch {
        // Keep the reactive value usable when storage is unavailable or full.
      }
    },
    { deep: true },
  );

  return value;
}
