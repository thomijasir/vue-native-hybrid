import type { Urb } from "~/lib/Urb";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useFetch } from "./useFetch";

const setUrb = (isAvailable: boolean, send = vi.fn()) => {
  window.urb = {
    isAvailable: vi.fn(() => isAvailable),
    send,
  } as unknown as Urb;

  return send;
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(window, "urb");
});

describe("useFetch", () => {
  it("uses URB fetch when the native bridge is available", async () => {
    const nativeResponse = new Response("native response", { status: 200 });
    const send = setUrb(true, vi.fn().mockResolvedValue(nativeResponse));
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const response = await useFetch("/api/profile", {
      method: "POST",
      headers: new Headers({ authorization: "Bearer token" }),
      bodyJson: { name: "Ada" },
    });

    expect(response).toBe(nativeResponse);
    expect(send).toHaveBeenCalledWith({
      name: "fetch",
      payload: {
        url: new URL("/api/profile", window.location.href).href,
        method: "POST",
        headers: [["authorization", "Bearer token"]],
        body: undefined,
        bodyJson: { name: "Ada" },
      },
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("uses browser fetch when URB is unavailable", async () => {
    const browserResponse = new Response("browser response", { status: 200 });
    const send = setUrb(false);
    const fetchSpy = vi.fn().mockResolvedValue(browserResponse);
    vi.stubGlobal("fetch", fetchSpy);

    const response = await useFetch("https://example.test/profile", {
      method: "POST",
      headers: { authorization: "Bearer token" },
      bodyJson: { name: "Ada" },
    });

    expect(response).toBe(browserResponse);
    expect(send).not.toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalledOnce();

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://example.test/profile");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ name: "Ada" }));
    expect(new Headers(init.headers)).toEqual(
      new Headers({
        authorization: "Bearer token",
        "content-type": "application/json",
      }),
    );
  });

  it("uses browser fetch when the URB API is not installed", async () => {
    const browserResponse = new Response(null, { status: 204 });
    const fetchSpy = vi.fn().mockResolvedValue(browserResponse);
    vi.stubGlobal("fetch", fetchSpy);

    await expect(useFetch("/health")).resolves.toBe(browserResponse);
    expect(fetchSpy).toHaveBeenCalledWith("/health", {
      method: undefined,
      headers: expect.any(Headers),
      body: undefined,
    });
  });

  it("passes supported raw bodies to browser fetch", async () => {
    const body = new FormData();
    body.set("name", "Ada");
    setUrb(false);
    const fetchSpy = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal("fetch", fetchSpy);

    await useFetch("/upload", { method: "POST", body });

    expect(fetchSpy).toHaveBeenCalledWith("/upload", {
      method: "POST",
      headers: expect.any(Headers),
      body,
    });
  });

  it("rejects requests that include both body types", async () => {
    setUrb(false);
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(
      useFetch("/profile", {
        body: "raw",
        bodyJson: { name: "Ada" },
      }),
    ).rejects.toThrow("cannot include both body and bodyJson");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fall back to browser fetch after a URB error", async () => {
    const nativeError = new Error("Native request failed");
    setUrb(true, vi.fn().mockRejectedValue(nativeError));
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(useFetch("https://example.test/profile")).rejects.toBe(
      nativeError,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
