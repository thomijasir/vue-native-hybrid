import { nextTick } from "vue";
import { beforeEach, describe, expect, it } from "vitest";
import { useSessionStorage } from "./useSessionStorage";

describe("useSessionStorage", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("uses the default value when the key is not stored", () => {
    const value = useSessionStorage("checkout-step", 1);

    expect(value.value).toBe(1);
  });

  it("restores a stored value", () => {
    window.sessionStorage.setItem(
      "draft",
      JSON.stringify({ title: "Saved draft", published: false }),
    );

    const value = useSessionStorage("draft", {
      title: "",
      published: false,
    });

    expect(value.value).toEqual({
      title: "Saved draft",
      published: false,
    });
  });

  it("persists value changes", async () => {
    const value = useSessionStorage("checkout-step", 1);

    value.value = 2;
    await nextTick();

    expect(window.sessionStorage.getItem("checkout-step")).toBe("2");
  });

  it("persists nested object changes", async () => {
    const value = useSessionStorage("draft", {
      form: { completed: false },
    });

    value.value.form.completed = true;
    await nextTick();

    expect(JSON.parse(window.sessionStorage.getItem("draft")!)).toEqual({
      form: { completed: true },
    });
  });

  it("falls back to the default value when stored JSON is invalid", () => {
    window.sessionStorage.setItem("checkout-step", "not-json");

    const value = useSessionStorage("checkout-step", 1);

    expect(value.value).toBe(1);
  });

  it("removes the key when the value cannot be serialized", async () => {
    window.sessionStorage.setItem("optional", JSON.stringify("stored"));
    const value = useSessionStorage<string | undefined>("optional", undefined);

    value.value = undefined;
    await nextTick();

    expect(window.sessionStorage.getItem("optional")).toBeNull();
  });
});
