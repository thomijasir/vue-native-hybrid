import { nextTick } from "vue";
import { beforeEach, describe, expect, it } from "vitest";
import { useLocalStorage } from "./useLocalStorage";

const testKeys = ["theme", "preferences", "count", "settings", "optional"];

describe("useLocalStorage", () => {
  beforeEach(() => {
    for (const key of testKeys) {
      window.localStorage.removeItem(key);
    }
  });

  it("uses the default value when the key is not stored", () => {
    const value = useLocalStorage("theme", "light");

    expect(value.value).toBe("light");
  });

  it("restores a stored value", () => {
    window.localStorage.setItem(
      "preferences",
      JSON.stringify({ theme: "dark", compact: true }),
    );

    const value = useLocalStorage("preferences", {
      theme: "light",
      compact: false,
    });

    expect(value.value).toEqual({ theme: "dark", compact: true });
  });

  it("persists value changes", async () => {
    const value = useLocalStorage("count", 0);

    value.value = 3;
    await nextTick();

    expect(window.localStorage.getItem("count")).toBe("3");
  });

  it("persists nested object changes", async () => {
    const value = useLocalStorage("settings", {
      notifications: { enabled: false },
    });

    value.value.notifications.enabled = true;
    await nextTick();

    expect(JSON.parse(window.localStorage.getItem("settings")!)).toEqual({
      notifications: { enabled: true },
    });
  });

  it("falls back to the default value when stored JSON is invalid", () => {
    window.localStorage.setItem("theme", "not-json");

    const value = useLocalStorage("theme", "light");

    expect(value.value).toBe("light");
  });

  it("removes the key when the value cannot be serialized", async () => {
    window.localStorage.setItem("optional", JSON.stringify("stored"));
    const value = useLocalStorage<string | undefined>("optional", undefined);

    value.value = undefined;
    await nextTick();

    expect(window.localStorage.getItem("optional")).toBeNull();
  });
});
