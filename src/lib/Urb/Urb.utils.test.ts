import { afterEach, describe, expect, it, vi } from "vitest";
import type { UrbFetchPayload } from "./Urb.interface";
import {
  createRequestId,
  handleUnavailableFire,
  serializeFetchPayload,
  serializeWebSocketBody,
  serializeWebSocketOpenPayload,
  transformCameraResult,
  transformClipboardGetTextResult,
  transformFetchResult,
  transformPickFilesResult,
  transformWebSocketOpenResult,
} from "./Urb.utils";

const textToBase64 = (value: string) => btoa(value);

const stubRequestId = (id = "socket-1") => {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      randomUUID: vi.fn(() => id),
    },
    configurable: true,
    writable: true,
  });
};

describe("URB utilities", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("validates clipboard getText results", async () => {
    await expect(
      transformClipboardGetTextResult({ text: "Copied" }),
    ).resolves.toEqual({
      text: "Copied",
    });

    await expect(
      transformClipboardGetTextResult({ text: 42 }),
    ).rejects.toMatchObject({
      code: "URB_INVALID_CLIPBOARD_RESULT",
    });
  });

  it("serializes websocket open payloads with normalized headers and fallback id", () => {
    stubRequestId();

    expect(
      serializeWebSocketOpenPayload({
        url: "wss://example.test/socket",
        headers: {
          Authorization: "Bearer token",
        },
        protocols: ["json"],
      }),
    ).toEqual({
      socketId: "socket-1",
      url: "wss://example.test/socket",
      headers: [["Authorization", "Bearer token"]],
      protocols: ["json"],
    });

    expect(
      serializeWebSocketOpenPayload({
        socketId: "explicit-socket",
        url: "wss://example.test/socket",
        headers: [["X-Trace", "abc"]],
      }),
    ).toEqual({
      socketId: "explicit-socket",
      url: "wss://example.test/socket",
      headers: [["X-Trace", "abc"]],
      protocols: [],
    });

    expect(() =>
      serializeWebSocketOpenPayload({
        url: "",
      }),
    ).toThrowError(/requires a URL/);
  });

  it("validates websocket open results", async () => {
    await expect(
      transformWebSocketOpenResult({ socketId: "socket-1" }),
    ).resolves.toEqual({
      socketId: "socket-1",
    });

    await expect(
      transformWebSocketOpenResult({ socketId: "" }),
    ).rejects.toMatchObject({
      code: "URB_INVALID_WEBSOCKET_RESULT",
    });
  });

  it("serializes websocket message bodies", async () => {
    await expect(serializeWebSocketBody("hello")).resolves.toEqual({
      kind: "text",
      value: "hello",
    });
    await expect(serializeWebSocketBody(new Blob(["blob"]))).resolves.toEqual({
      kind: "base64",
      value: textToBase64("blob"),
    });
    await expect(
      serializeWebSocketBody(new TextEncoder().encode("typed")),
    ).resolves.toEqual({
      kind: "base64",
      value: textToBase64("typed"),
    });
    await expect(
      serializeWebSocketBody(new TextEncoder().encode("buffer").buffer),
    ).resolves.toEqual({
      kind: "base64",
      value: textToBase64("buffer"),
    });
  });

  it("serializes fetch payload bodies", async () => {
    await expect(
      serializeFetchPayload({ url: "https://example.test" }),
    ).resolves.toEqual({
      url: "https://example.test",
      method: undefined,
      headers: [],
      body: { kind: "empty" },
    });

    await expect(
      serializeFetchPayload({
        url: "https://example.test",
        method: "POST",
        headers: [["accept", "application/json"]],
        bodyJson: { ok: true },
      }),
    ).resolves.toEqual({
      url: "https://example.test",
      method: "POST",
      headers: [
        ["accept", "application/json"],
        ["content-type", "application/json"],
      ],
      body: {
        kind: "text",
        value: JSON.stringify({ ok: true }),
      },
    });

    await expect(
      serializeFetchPayload({
        url: "https://example.test",
        body: "plain text",
      }),
    ).resolves.toMatchObject({
      body: {
        kind: "text",
        value: "plain text",
      },
    });
    await expect(
      serializeFetchPayload({
        url: "https://example.test",
        body: new Blob(["blob"], { type: "text/plain" }),
      }),
    ).resolves.toMatchObject({
      body: {
        kind: "base64",
        mimeType: "text/plain",
        value: textToBase64("blob"),
      },
    });
    await expect(
      serializeFetchPayload({
        url: "https://example.test",
        body: new TextEncoder().encode("bytes"),
      }),
    ).resolves.toMatchObject({
      body: {
        kind: "base64",
        value: textToBase64("bytes"),
      },
    });
  });

  it("serializes FormData fetch bodies", async () => {
    const formData = new FormData();
    formData.set("title", "Profile");
    formData.set(
      "avatar",
      new File(["image"], "avatar.png", { type: "image/png" }),
    );

    await expect(
      serializeFetchPayload({
        url: "https://example.test/upload",
        body: formData,
      }),
    ).resolves.toEqual({
      url: "https://example.test/upload",
      method: undefined,
      headers: [],
      body: {
        kind: "multipart",
        parts: [
          {
            kind: "text",
            name: "title",
            value: "Profile",
          },
          {
            kind: "file",
            name: "avatar",
            fileName: "avatar.png",
            mimeType: "image/png",
            bodyBase64: textToBase64("image"),
          },
        ],
      },
    });
  });

  it("rejects invalid fetch payloads", async () => {
    await expect(serializeFetchPayload({ url: "" })).rejects.toMatchObject({
      code: "URB_INVALID_FETCH_PAYLOAD",
    });
    await expect(
      serializeFetchPayload({
        url: "https://example.test",
        body: "text",
        bodyJson: { ok: true },
      } as UrbFetchPayload),
    ).rejects.toMatchObject({
      code: "URB_INVALID_FETCH_PAYLOAD",
    });
  });

  it("transforms native fetch results into Response objects", async () => {
    const response = await transformFetchResult({
      status: 201,
      statusText: "Created",
      headers: [["content-type", "text/plain"]],
      bodyBase64: textToBase64("Created body"),
      url: "https://example.test",
    });

    expect(response.status).toBe(201);
    expect(response.statusText).toBe("Created");
    expect(response.headers.get("content-type")).toBe("text/plain");
    await expect(response.text()).resolves.toBe("Created body");
  });

  it("keeps empty-body native fetch statuses empty", async () => {
    const response = await transformFetchResult({
      status: 204,
      statusText: "No Content",
      headers: [],
      bodyBase64: textToBase64("ignored"),
      url: "https://example.test",
    });

    expect(response.status).toBe(204);
    await expect(response.text()).resolves.toBe("");
  });
});

describe("URB utilities (extended)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const validCameraResult = {
    resourceUrl: "https://example.test/cam.jpg",
    fileName: "cam.jpg",
    mimeType: "image/jpeg",
    size: 10,
    createdAt: "2026-01-01T00:00:00Z",
  };

  const validPickItem = {
    resourceUrl: "https://example.test/f.txt",
    fileName: "f.txt",
    mimeType: "text/plain",
    size: 3,
    createdAt: "2026-01-01T00:00:00Z",
  };

  describe("transformCameraResult", () => {
    it.each([
      ["resourceUrl", { ...validCameraResult, resourceUrl: 1 }],
      ["fileName", { ...validCameraResult, fileName: 1 }],
      ["mimeType", { ...validCameraResult, mimeType: "image/png" }],
      ["size", { ...validCameraResult, size: "10" }],
      ["createdAt", { ...validCameraResult, createdAt: 1 }],
    ])("rejects when %s is invalid", async (_field, value) => {
      await expect(transformCameraResult(value)).rejects.toMatchObject({
        code: "URB_INVALID_CAMERA_RESULT",
      });
    });

    it("rejects when the native file fetch returns a non-ok response", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(null, { status: 500 }),
      );
      await expect(
        transformCameraResult(validCameraResult),
      ).rejects.toMatchObject({
        code: "URB_RESOURCE_FETCH_FAILED",
      });
    });
  });

  describe("transformPickFilesResult", () => {
    it("transforms valid pick files results", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(new Blob(["abc"])),
      );
      await expect(
        transformPickFilesResult({ items: [validPickItem] }),
      ).resolves.toEqual({
        files: [expect.any(File)],
        items: [
          {
            file: expect.any(File),
            fileName: "f.txt",
            mimeType: "text/plain",
            size: 3,
            createdAt: "2026-01-01T00:00:00Z",
          },
        ],
      });
    });

    it.each([
      ["items is not an array", { items: "nope" }],
      ["items is empty", { items: [] }],
    ])("rejects when %s", async (_label, value) => {
      await expect(transformPickFilesResult(value)).rejects.toMatchObject({
        code: "URB_INVALID_PICKER_RESULT",
      });
    });

    it.each([
      ["resourceUrl", { ...validPickItem, resourceUrl: 1 }],
      ["fileName", { ...validPickItem, fileName: 1 }],
      ["mimeType", { ...validPickItem, mimeType: 1 }],
      ["size", { ...validPickItem, size: "3" }],
      ["createdAt", { ...validPickItem, createdAt: 1 }],
    ])("rejects when item %s is invalid", async (_field, item) => {
      await expect(
        transformPickFilesResult({ items: [item] }),
      ).rejects.toMatchObject({
        code: "URB_INVALID_PICKER_RESULT",
      });
    });
  });

  it("rejects unsupported websocket body types", async () => {
    await expect(serializeWebSocketBody(123 as never)).rejects.toMatchObject({
      code: "URB_INVALID_WEBSOCKET_PAYLOAD",
    });
  });

  describe("transformFetchResult (invalid)", () => {
    it.each([
      ["status", { statusText: "OK", headers: [], bodyBase64: "", url: "u" }],
      ["statusText", { status: 200, headers: [], bodyBase64: "", url: "u" }],
      ["headers", { status: 200, statusText: "OK", bodyBase64: "", url: "u" }],
      ["bodyBase64", { status: 200, statusText: "OK", headers: [], url: "u" }],
      ["url", { status: 200, statusText: "OK", headers: [], bodyBase64: "" }],
    ])("rejects when %s is invalid", async (_field, value) => {
      await expect(transformFetchResult(value)).rejects.toMatchObject({
        code: "URB_INVALID_FETCH_RESULT",
      });
    });

    it("skips malformed fetch result headers", async () => {
      const response = await transformFetchResult({
        status: 200,
        statusText: "OK",
        headers: [["only"], ["ok", "v"], "bad"],
        bodyBase64: textToBase64("x"),
        url: "u",
      });
      expect(response.headers.get("ok")).toBe("v");
    });

    it("returns an empty body when bodyBase64 is empty", async () => {
      const response = await transformFetchResult({
        status: 200,
        statusText: "OK",
        headers: [],
        bodyBase64: "",
        url: "u",
      });
      await expect(response.text()).resolves.toBe("");
    });
  });

  describe("handleUnavailableFire", () => {
    it("logs intent:open fire requests", () => {
      const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
      handleUnavailableFire({
        name: "intent:open",
        payload: { target: "appSettings" },
      });
      expect(info).toHaveBeenCalledWith("[URB intent]", "appSettings");
    });

    it("logs browser:open fire requests with an explicit mode", () => {
      const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
      handleUnavailableFire({
        name: "browser:open",
        payload: { url: "https://example.test", mode: "inApp" },
      });
      expect(info).toHaveBeenCalledWith(
        "[URB browser]",
        "https://example.test",
        "inApp",
      );
    });

    it("defaults browser:open mode to external", () => {
      const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
      handleUnavailableFire({
        name: "browser:open",
        payload: { url: "https://example.test" },
      });
      expect(info).toHaveBeenCalledWith(
        "[URB browser]",
        "https://example.test",
        "external",
      );
    });

    it("no-ops for unknown fire command names", () => {
      const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
      handleUnavailableFire({ name: "unknown" as never, payload: {} as never });
      expect(info).not.toHaveBeenCalled();
    });
  });

  it("falls back when crypto.randomUUID is unavailable", () => {
    Object.defineProperty(globalThis, "crypto", {
      value: {},
      configurable: true,
      writable: true,
    });
    expect(createRequestId()).toMatch(/^urb-\d+-[a-z0-9]+$/);
  });

  it("normalizes fetch headers from object form", async () => {
    await expect(
      serializeFetchPayload({
        url: "https://example.test",
        headers: { accept: "application/json" },
      }),
    ).resolves.toMatchObject({
      headers: [["accept", "application/json"]],
    });
  });

  it("does not override an explicit content-type for json bodies", async () => {
    await expect(
      serializeFetchPayload({
        url: "https://example.test",
        headers: [["content-type", "text/plain"]],
        bodyJson: { ok: true },
      }),
    ).resolves.toMatchObject({
      headers: [["content-type", "text/plain"]],
    });
  });

  it("serializes ArrayBuffer fetch bodies", async () => {
    const buffer = new TextEncoder().encode("buf").buffer;
    await expect(
      serializeFetchPayload({ url: "https://example.test", body: buffer }),
    ).resolves.toMatchObject({
      body: { kind: "base64", value: textToBase64("buf") },
    });
  });

  it("serializes Blob fetch bodies without a type", async () => {
    await expect(
      serializeFetchPayload({
        url: "https://example.test",
        body: new Blob(["x"]),
      }),
    ).resolves.toMatchObject({
      body: { kind: "base64", value: textToBase64("x") },
    });
  });

  it("serializes FormData fetch bodies with blob entries", async () => {
    const formData = new FormData();
    formData.set("blob", new Blob(["data"]));
    await expect(
      serializeFetchPayload({ url: "https://example.test", body: formData }),
    ).resolves.toMatchObject({
      body: {
        kind: "multipart",
        parts: [
          {
            kind: "file",
            name: "blob",
            fileName: "blob",
            mimeType: "application/octet-stream",
            bodyBase64: textToBase64("data"),
          },
        ],
      },
    });
  });

  it("rejects unsupported fetch body types", async () => {
    await expect(
      serializeFetchPayload({
        url: "https://example.test",
        body: 123 as never,
      }),
    ).rejects.toMatchObject({
      code: "URB_INVALID_FETCH_PAYLOAD",
    });
  });
});
