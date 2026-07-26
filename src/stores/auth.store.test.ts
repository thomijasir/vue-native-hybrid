import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAuthStore } from "./auth.store";

describe("sample auth store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("starts signed out", () => {
    const store = useAuthStore();

    expect(store.isLoggedIn).toBe(false);
    expect(store.user).toBeNull();
  });

  it("signs a sample user in and out", () => {
    const store = useAuthStore();

    store.signIn("developer@example.com");

    expect(store.isLoggedIn).toBe(true);
    expect(store.user).toEqual({ email: "developer@example.com" });

    store.signOut();

    expect(store.isLoggedIn).toBe(false);
    expect(store.user).toBeNull();
  });
});
