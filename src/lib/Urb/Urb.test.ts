import { beforeEach, describe, expect, it, vi } from "vitest";

import { initURB, UrbError } from "./index";

type PostedEnvelope = {
  id?: string;
  type: "fire" | "send";
  name: string;
  payload?: unknown;
};

const createBridge = () => {
  const messages: PostedEnvelope[] = [];

  return {
    messages,
    bridge: {
      postMessage: vi.fn((message: string) => {
        messages.push(JSON.parse(message) as PostedEnvelope);
      }),
    },
  };
};

const installWindow = () => {
  const windowStub: Partial<Window> = {};
  Object.defineProperty(globalThis, "window", {
    value: windowStub,
    configurable: true,
    writable: true,
  });

  return windowStub as Window;
};

const stubRequestId = (id = "request-1") => {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      randomUUID: vi.fn(() => id),
    },
    configurable: true,
    writable: true,
  });
};

const textToBase64 = (value: string) => btoa(value);

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("initURB", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    installWindow();
    stubRequestId();
  });

  it("installs the URB client and native response receiver on window", () => {
    initURB();

    expect(window.urb).toEqual({
      fire: expect.any(Function),
      send: expect.any(Function),
      on: expect.any(Function),
      off: expect.any(Function),
      websocket: {
        open: expect.any(Function),
      },
      clipboard: {
        getText: expect.any(Function),
        setText: expect.any(Function),
      },
      isAvailable: expect.any(Function),
    });
    expect(window.__urbReceive).toEqual(expect.any(Function));
    expect(window.__urbEvent).toEqual(expect.any(Function));
  });

  it("reports native bridge availability", () => {
    initURB();

    expect(window.urb.isAvailable()).toBe(false);

    window.urbNative = createBridge().bridge;

    expect(window.urb.isAvailable()).toBe(true);
  });

  it("logs toast fire requests when native bridge is unavailable", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    initURB();

    window.urb.fire({
      name: "toast",
      payload: {
        text: "Saved",
      },
    });

    expect(info).toHaveBeenCalledWith("[URB toast]", "Saved");
  });

  it("posts fire requests to the native bridge", () => {
    const { bridge, messages } = createBridge();
    window.urbNative = bridge;
    initURB();

    window.urb.fire({
      name: "toast",
      payload: {
        text: "Saved",
      },
    });

    expect(bridge.postMessage).toHaveBeenCalledTimes(1);
    expect(messages).toEqual([
      {
        type: "fire",
        name: "toast",
        payload: {
          text: "Saved",
        },
      },
    ]);
  });

  it("rejects send requests when native bridge is unavailable", async () => {
    initURB();

    await expect(
      window.urb.send({
        name: "permissions:get",
      }),
    ).rejects.toMatchObject({
      name: "UrbError",
      code: "URB_UNAVAILABLE",
      message: "Native URB bridge is not available",
    });
  });

  it("posts send requests and resolves matching native responses", async () => {
    const { bridge, messages } = createBridge();
    window.urbNative = bridge;
    initURB();

    const responsePromise = window.urb.send({
      name: "permissions:get",
      payload: {
        names: ["camera"],
      },
    });
    await flushPromises();

    expect(messages).toEqual([
      {
        id: "request-1",
        type: "send",
        name: "permissions:get",
        payload: {
          names: ["camera"],
        },
      },
    ]);

    const result = [
      {
        name: "camera",
        status: "granted",
        granted: true,
        shouldShowRationale: false,
        androidPermissions: ["android.permission.CAMERA"],
      },
    ] as const;

    window.__urbReceive?.(
      JSON.stringify({
        id: "request-1",
        ok: true,
        result,
      }),
    );

    await expect(responsePromise).resolves.toEqual(result);
  });

  it("gets clipboard text through the convenience API", async () => {
    const { bridge, messages } = createBridge();
    window.urbNative = bridge;
    initURB();

    const responsePromise = window.urb.clipboard.getText();
    await flushPromises();

    expect(messages).toEqual([
      {
        id: "request-1",
        type: "send",
        name: "clipboard:getText",
      },
    ]);

    window.__urbReceive?.(
      JSON.stringify({
        id: "request-1",
        ok: true,
        result: {
          text: "Copied text",
        },
      }),
    );

    await expect(responsePromise).resolves.toBe("Copied text");
  });

  it("sets clipboard text through the convenience API", async () => {
    const { bridge, messages } = createBridge();
    window.urbNative = bridge;
    initURB();

    const responsePromise = window.urb.clipboard.setText("hello", {
      label: "Greeting",
    });
    await flushPromises();

    expect(messages).toEqual([
      {
        id: "request-1",
        type: "send",
        name: "clipboard:setText",
        payload: {
          text: "hello",
          label: "Greeting",
        },
      },
    ]);

    window.__urbReceive?.(
      JSON.stringify({
        id: "request-1",
        ok: true,
        result: {},
      }),
    );

    await expect(responsePromise).resolves.toBeUndefined();
  });

  it("rejects invalid clipboard text results", async () => {
    const { bridge } = createBridge();
    window.urbNative = bridge;
    initURB();

    const responsePromise = window.urb.clipboard.getText();

    window.__urbReceive?.(
      JSON.stringify({
        id: "request-1",
        ok: true,
        result: {},
      }),
    );

    await expect(responsePromise).rejects.toMatchObject({
      code: "URB_INVALID_CLIPBOARD_RESULT",
      message: "Native clipboard result is invalid",
    });
  });

  it("supports generic clipboard getText send requests", async () => {
    const { bridge, messages } = createBridge();
    window.urbNative = bridge;
    initURB();

    const responsePromise = window.urb.send({
      name: "clipboard:getText",
    });
    await flushPromises();

    expect(messages).toEqual([
      {
        id: "request-1",
        type: "send",
        name: "clipboard:getText",
      },
    ]);

    window.__urbReceive?.(
      JSON.stringify({
        id: "request-1",
        ok: true,
        result: {
          text: "Generic text",
        },
      }),
    );

    await expect(responsePromise).resolves.toEqual({
      text: "Generic text",
    });
  });

  it("posts device info send requests and resolves native metadata", async () => {
    const { bridge, messages } = createBridge();
    window.urbNative = bridge;
    initURB();

    const responsePromise = window.urb.send({
      name: "device:info",
    });
    await flushPromises();

    expect(messages).toEqual([
      {
        id: "request-1",
        type: "send",
        name: "device:info",
      },
    ]);

    const result = {
      platform: "android",
      osName: "Android",
      osVersion: "16",
      sdkInt: 36,
      manufacturer: "Google",
      model: "Pixel 9",
      brand: "google",
      device: "tokay",
      appId: "com.example.mywebview",
      appVersionName: "1.0",
      appVersionCode: 1,
      buildType: "debug",
      locale: "en-US",
      timeZone: "America/Los_Angeles",
    } as const;

    window.__urbReceive?.(
      JSON.stringify({
        id: "request-1",
        ok: true,
        result,
      }),
    );

    await expect(responsePromise).resolves.toEqual(result);
  });

  it("posts camera capture compression payloads", async () => {
    const { bridge, messages } = createBridge();
    window.urbNative = bridge;
    initURB();

    window.urb.send({
      name: "camera:capture",
      payload: {
        compression: {
          quality: 76,
          maxWidth: 1600,
          maxHeight: 1200,
        },
      },
    });
    await flushPromises();

    expect(messages).toEqual([
      {
        id: "request-1",
        type: "send",
        name: "camera:capture",
        payload: {
          compression: {
            quality: 76,
            maxWidth: 1600,
            maxHeight: 1200,
          },
        },
      },
    ]);
  });

  it("posts media picker compression payloads", async () => {
    const { bridge, messages } = createBridge();
    window.urbNative = bridge;
    initURB();

    window.urb.send({
      name: "media:pick",
      payload: {
        type: "image",
        compression: false,
      },
    });
    await flushPromises();

    expect(messages).toEqual([
      {
        id: "request-1",
        type: "send",
        name: "media:pick",
        payload: {
          type: "image",
          compression: false,
        },
      },
    ]);
  });

  it("transforms camera results with file size", async () => {
    const { bridge } = createBridge();
    window.urbNative = bridge;
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(new Blob(["image-bytes"], { type: "image/jpeg" }), {
        status: 200,
      }),
    );
    initURB();

    const responsePromise = window.urb.send({
      name: "camera:capture",
    });

    window.__urbReceive?.(
      JSON.stringify({
        id: "request-1",
        ok: true,
        result: {
          resourceUrl:
            "https://appassets.androidplatform.net/urb/resource/token",
          fileName: "camera.jpg",
          mimeType: "image/jpeg",
          size: 1234,
          createdAt: "2026-05-07T00:00:00Z",
        },
      }),
    );

    await expect(responsePromise).resolves.toMatchObject({
      fileName: "camera.jpg",
      mimeType: "image/jpeg",
      size: 1234,
      createdAt: "2026-05-07T00:00:00Z",
    });
  });

  it("normalizes native resource fetch failures", async () => {
    const { bridge } = createBridge();
    window.urbNative = bridge;
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    initURB();

    const responsePromise = window.urb.send({
      name: "camera:capture",
    });

    window.__urbReceive?.(
      JSON.stringify({
        id: "request-1",
        ok: true,
        result: {
          resourceUrl:
            "https://appassets.androidplatform.net/urb-resource/token",
          fileName: "camera.jpg",
          mimeType: "image/jpeg",
          size: 1234,
          createdAt: "2026-05-07T00:00:00Z",
        },
      }),
    );

    await expect(responsePromise).rejects.toMatchObject({
      name: "UrbError",
      code: "URB_RESOURCE_FETCH_FAILED",
      message: "Unable to read native file resource",
    });
  });

  it("rejects send requests with native UrbError responses", async () => {
    const { bridge } = createBridge();
    window.urbNative = bridge;
    initURB();

    const responsePromise = window.urb.send({
      name: "permissions:request",
      payload: {
        names: ["camera"],
      },
    });

    window.__urbReceive?.(
      JSON.stringify({
        id: "request-1",
        ok: false,
        error: {
          code: "PERMISSION_DENIED",
          message: "Camera denied",
        },
      }),
    );

    await expect(responsePromise).rejects.toBeInstanceOf(UrbError);
    await expect(responsePromise).rejects.toMatchObject({
      code: "PERMISSION_DENIED",
      message: "Camera denied",
    });
  });

  it("serializes JSON fetch payloads and transforms native fetch responses", async () => {
    const { bridge, messages } = createBridge();
    window.urbNative = bridge;
    initURB();

    const responsePromise = window.urb.send({
      name: "fetch",
      payload: {
        url: "https://example.test/api",
        method: "POST",
        bodyJson: {
          hello: "world",
        },
      },
    });
    await flushPromises();

    expect(messages[0]).toEqual({
      id: "request-1",
      type: "send",
      name: "fetch",
      payload: {
        url: "https://example.test/api",
        method: "POST",
        headers: [["content-type", "application/json"]],
        body: {
          kind: "text",
          value: JSON.stringify({
            hello: "world",
          }),
        },
      },
    });

    window.__urbReceive?.(
      JSON.stringify({
        id: "request-1",
        ok: true,
        result: {
          status: 201,
          statusText: "Created",
          headers: [["content-type", "application/json"]],
          bodyBase64: textToBase64(JSON.stringify({ ok: true })),
          url: "https://example.test/api",
        },
      }),
    );

    const response = await responsePromise;

    expect(response.status).toBe(201);
    expect(response.statusText).toBe("Created");
    expect(response.headers.get("content-type")).toBe("application/json");
    await expect(response.json()).resolves.toEqual({
      ok: true,
    });
  });

  it("subscribes, dispatches, and unsubscribes typed native URB events", () => {
    initURB();

    const handler = vi.fn();
    const unsubscribe = window.urb.on("deepLink:open", handler);

    window.__urbEvent?.(
      JSON.stringify({
        channel: "urb",
        name: "deepLink:open",
        payload: {
          url: "mywebview://demo/path",
        },
      }),
    );

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({
      url: "mywebview://demo/path",
    });

    unsubscribe();
    window.__urbEvent?.(
      JSON.stringify({
        channel: "urb",
        name: "deepLink:open",
        payload: {
          url: "mywebview://demo/after-unsubscribe",
        },
      }),
    );

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("dispatches observable fire command errors", () => {
    initURB();

    const handler = vi.fn();
    window.urb.on("command:error", handler);

    window.__urbEvent?.(
      JSON.stringify({
        channel: "urb",
        name: "command:error",
        payload: {
          command: "browser:open",
          code: "BROWSER_URL_INVALID",
          message: "Browser open requires an http or https URL",
        },
      }),
    );

    expect(handler).toHaveBeenCalledWith({
      command: "browser:open",
      code: "BROWSER_URL_INVALID",
      message: "Browser open requires an http or https URL",
    });
  });

  it("removes typed native URB event listeners with off", () => {
    initURB();

    const handler = vi.fn();
    window.urb.on("network:statusChange", handler);
    window.urb.off("network:statusChange", handler);

    window.__urbEvent?.(
      JSON.stringify({
        channel: "urb",
        name: "network:statusChange",
        payload: {
          connected: true,
          type: "wifi",
          expensive: false,
        },
      }),
    );

    expect(handler).not.toHaveBeenCalled();
  });

  it("opens native websocket handles and routes open events", async () => {
    const { bridge, messages } = createBridge();
    window.urbNative = bridge;
    initURB();

    const socketPromise = window.urb.websocket.open({
      url: "wss://example.test/socket",
      headers: {
        authorization: "Bearer token",
      },
      protocols: ["json"],
    });
    await flushPromises();

    expect(messages[0]).toEqual({
      id: "request-1",
      type: "send",
      name: "websocket:open",
      payload: {
        socketId: "request-1",
        url: "wss://example.test/socket",
        headers: [["authorization", "Bearer token"]],
        protocols: ["json"],
      },
    });

    window.__urbReceive?.(
      JSON.stringify({
        id: "request-1",
        ok: true,
        result: {
          socketId: "request-1",
        },
      }),
    );

    const socket = await socketPromise;
    const onopen = vi.fn();
    socket.onopen = onopen;

    window.__urbEvent?.(
      JSON.stringify({
        channel: "websocket",
        socketId: "request-1",
        type: "open",
        protocol: "json",
      }),
    );

    expect(socket.readyState).toBe(1);
    expect(socket.protocol).toBe("json");
    expect(onopen).toHaveBeenCalledWith({
      socketId: "request-1",
      protocol: "json",
    });
  });

  it("routes native websocket text and binary message events", async () => {
    const { bridge } = createBridge();
    window.urbNative = bridge;
    initURB();

    const socketPromise = window.urb.websocket.open({
      url: "wss://example.test/socket",
    });
    await flushPromises();
    window.__urbReceive?.(
      JSON.stringify({
        id: "request-1",
        ok: true,
        result: {
          socketId: "request-1",
        },
      }),
    );
    const socket = await socketPromise;
    const onmessage = vi.fn();
    socket.onmessage = onmessage;

    window.__urbEvent?.(
      JSON.stringify({
        channel: "websocket",
        socketId: "request-1",
        type: "message",
        data: "hello",
        binary: false,
      }),
    );
    window.__urbEvent?.(
      JSON.stringify({
        channel: "websocket",
        socketId: "request-1",
        type: "message",
        dataBase64: textToBase64("abc"),
        binary: true,
      }),
    );

    expect(onmessage).toHaveBeenNthCalledWith(1, {
      socketId: "request-1",
      data: "hello",
      binary: false,
    });
    const binaryEvent = onmessage.mock.calls[1]?.[0];
    expect(binaryEvent).toMatchObject({
      socketId: "request-1",
      binary: true,
    });
    expect(Array.from(new Uint8Array(binaryEvent.data))).toEqual([97, 98, 99]);
  });

  it("serializes websocket text and binary sends", async () => {
    const { bridge, messages } = createBridge();
    window.urbNative = bridge;
    initURB();

    const socketPromise = window.urb.websocket.open({
      url: "wss://example.test/socket",
    });
    await flushPromises();
    window.__urbReceive?.(
      JSON.stringify({
        id: "request-1",
        ok: true,
        result: {
          socketId: "request-1",
        },
      }),
    );
    const socket = await socketPromise;

    const textSend = socket.send("hello");
    await flushPromises();
    expect(messages[1]).toEqual({
      id: "request-1",
      type: "send",
      name: "websocket:send",
      payload: {
        socketId: "request-1",
        body: {
          kind: "text",
          value: "hello",
        },
      },
    });
    window.__urbReceive?.(
      JSON.stringify({
        id: "request-1",
        ok: true,
        result: {},
      }),
    );
    await expect(textSend).resolves.toBeUndefined();

    const binarySend = socket.send(new Uint8Array([1, 2, 3]));
    await flushPromises();
    expect(messages[2]).toEqual({
      id: "request-1",
      type: "send",
      name: "websocket:send",
      payload: {
        socketId: "request-1",
        body: {
          kind: "base64",
          value: "AQID",
        },
      },
    });
    window.__urbReceive?.(
      JSON.stringify({
        id: "request-1",
        ok: true,
        result: {},
      }),
    );
    await expect(binarySend).resolves.toBeUndefined();
  });

  it("closes websocket handles and removes them after native close", async () => {
    const { bridge, messages } = createBridge();
    window.urbNative = bridge;
    initURB();

    const socketPromise = window.urb.websocket.open({
      url: "wss://example.test/socket",
    });
    await flushPromises();
    window.__urbReceive?.(
      JSON.stringify({
        id: "request-1",
        ok: true,
        result: {
          socketId: "request-1",
        },
      }),
    );
    const socket = await socketPromise;
    const onclose = vi.fn();
    socket.onclose = onclose;

    const closePromise = socket.close(1000, "done");
    await flushPromises();
    expect(socket.readyState).toBe(2);
    expect(messages[1]).toEqual({
      id: "request-1",
      type: "send",
      name: "websocket:close",
      payload: {
        socketId: "request-1",
        code: 1000,
        reason: "done",
      },
    });
    window.__urbReceive?.(
      JSON.stringify({
        id: "request-1",
        ok: true,
        result: {},
      }),
    );
    await expect(closePromise).resolves.toBeUndefined();

    window.__urbEvent?.(
      JSON.stringify({
        channel: "websocket",
        socketId: "request-1",
        type: "close",
        code: 1000,
        reason: "done",
      }),
    );

    expect(socket.readyState).toBe(3);
    expect(onclose).toHaveBeenCalledWith({
      socketId: "request-1",
      code: 1000,
      reason: "done",
    });
    await expect(socket.send("after-close")).rejects.toMatchObject({
      code: "URB_WEBSOCKET_CLOSED",
    });
  });
});

describe("initURB edge cases", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    installWindow();
    stubRequestId();
  });

  it("no-ops off for events with no listeners", () => {
    initURB();
    const handler = vi.fn();
    expect(() => window.urb.off("deepLink:open", handler)).not.toThrow();
  });

  it("ignores unparseable native responses", () => {
    initURB();
    expect(() => window.__urbReceive?.("not-json")).not.toThrow();
  });

  it("ignores native responses for unknown request ids", () => {
    initURB();
    expect(() =>
      window.__urbReceive?.(
        JSON.stringify({ id: "unknown", ok: true, result: {} }),
      ),
    ).not.toThrow();
  });

  it("rejects with a default error when a native response omits the error", async () => {
    const { bridge } = createBridge();
    window.urbNative = bridge;
    initURB();
    const promise = window.urb.send({ name: "device:info" });
    await flushPromises();
    window.__urbReceive?.(JSON.stringify({ id: "request-1", ok: false }));
    await expect(promise).rejects.toMatchObject({ code: "URB_UNKNOWN_ERROR" });
  });

  it("rejects send requests when payload serialization fails", async () => {
    const { bridge } = createBridge();
    window.urbNative = bridge;
    initURB();
    await expect(
      window.urb.send({ name: "fetch", payload: { url: "" } as never }),
    ).rejects.toMatchObject({ code: "URB_INVALID_FETCH_PAYLOAD" });
    expect(bridge.postMessage).not.toHaveBeenCalled();
  });

  it("ignores serialization rejections for already-resolved requests", async () => {
    const { bridge } = createBridge();
    window.urbNative = bridge;
    initURB();
    const promise = window.urb.send({
      name: "fetch",
      payload: { url: "" } as never,
    });
    window.__urbReceive?.(
      JSON.stringify({
        id: "request-1",
        ok: true,
        result: {
          status: 200,
          statusText: "OK",
          headers: [],
          bodyBase64: "",
          url: "u",
        },
      }),
    );
    await expect(promise).resolves.toBeInstanceOf(Response);
  });

  it("rejects websocket open when the native bridge is unavailable", async () => {
    initURB();
    await expect(
      window.urb.websocket.open({ url: "wss://example.test" }),
    ).rejects.toMatchObject({ code: "URB_UNAVAILABLE" });
  });

  it("rejects websocket open when the native socket id mismatches", async () => {
    const { bridge } = createBridge();
    window.urbNative = bridge;
    initURB();
    const promise = window.urb.websocket.open({ url: "wss://example.test" });
    await flushPromises();
    window.__urbReceive?.(
      JSON.stringify({ id: "request-1", ok: true, result: { socketId: "other" } }),
    );
    await expect(promise).rejects.toMatchObject({
      code: "URB_INVALID_WEBSOCKET_RESULT",
    });
  });

  it("rethrows websocket open native errors", async () => {
    const { bridge } = createBridge();
    window.urbNative = bridge;
    initURB();
    const promise = window.urb.websocket.open({ url: "wss://example.test" });
    await flushPromises();
    window.__urbReceive?.(
      JSON.stringify({
        id: "request-1",
        ok: false,
        error: { code: "WS_FAIL", message: "nope" },
      }),
    );
    await expect(promise).rejects.toMatchObject({ code: "WS_FAIL" });
  });

  it("marks websockets as closing on closing events", async () => {
    const { bridge } = createBridge();
    window.urbNative = bridge;
    initURB();
    const promise = window.urb.websocket.open({ url: "wss://example.test" });
    await flushPromises();
    window.__urbReceive?.(
      JSON.stringify({ id: "request-1", ok: true, result: { socketId: "request-1" } }),
    );
    const socket = await promise;
    window.__urbEvent?.(
      JSON.stringify({
        channel: "websocket",
        socketId: "request-1",
        type: "closing",
        code: 1001,
        reason: "going",
      }),
    );
    expect(socket.readyState).toBe(2);
  });

  it("dispatches websocket error events", async () => {
    const { bridge } = createBridge();
    window.urbNative = bridge;
    initURB();
    const promise = window.urb.websocket.open({ url: "wss://example.test" });
    await flushPromises();
    window.__urbReceive?.(
      JSON.stringify({ id: "request-1", ok: true, result: { socketId: "request-1" } }),
    );
    const socket = await promise;
    const onerror = vi.fn();
    socket.onerror = onerror;
    window.__urbEvent?.(
      JSON.stringify({
        channel: "websocket",
        socketId: "request-1",
        type: "error",
        message: "boom",
      }),
    );
    expect(onerror).toHaveBeenCalledWith({
      socketId: "request-1",
      message: "boom",
    });
  });

  it("no-ops close on an already-closed websocket", async () => {
    const { bridge } = createBridge();
    window.urbNative = bridge;
    initURB();
    const promise = window.urb.websocket.open({ url: "wss://example.test" });
    await flushPromises();
    window.__urbReceive?.(
      JSON.stringify({ id: "request-1", ok: true, result: { socketId: "request-1" } }),
    );
    const socket = await promise;
    window.__urbEvent?.(
      JSON.stringify({
        channel: "websocket",
        socketId: "request-1",
        type: "close",
        code: 1000,
        reason: "",
      }),
    );
    expect(socket.readyState).toBe(3);
    await expect(socket.close()).resolves.toBeUndefined();
  });

  it("rejects sends on a fully closed websocket", async () => {
    const { bridge } = createBridge();
    window.urbNative = bridge;
    initURB();
    const promise = window.urb.websocket.open({ url: "wss://example.test" });
    await flushPromises();
    window.__urbReceive?.(
      JSON.stringify({ id: "request-1", ok: true, result: { socketId: "request-1" } }),
    );
    const socket = await promise;
    window.__urbEvent?.(
      JSON.stringify({
        channel: "websocket",
        socketId: "request-1",
        type: "close",
        code: 1000,
        reason: "",
      }),
    );
    await expect(socket.send("x")).rejects.toMatchObject({
      code: "URB_WEBSOCKET_CLOSED",
    });
  });

  it("ignores unparseable native events", () => {
    initURB();
    expect(() => window.__urbEvent?.("not-json")).not.toThrow();
  });

  it("ignores native events on unknown channels", () => {
    initURB();
    expect(() =>
      window.__urbEvent?.(JSON.stringify({ channel: "unknown" })),
    ).not.toThrow();
  });

  it("ignores websocket events for unknown sockets", () => {
    initURB();
    expect(() =>
      window.__urbEvent?.(
        JSON.stringify({
          channel: "websocket",
          socketId: "missing",
          type: "open",
          protocol: "json",
        }),
      ),
    ).not.toThrow();
  });

  it("ignores websocket events with unknown types", async () => {
    const { bridge } = createBridge();
    window.urbNative = bridge;
    initURB();
    const promise = window.urb.websocket.open({ url: "wss://example.test" });
    await flushPromises();
    window.__urbReceive?.(
      JSON.stringify({ id: "request-1", ok: true, result: { socketId: "request-1" } }),
    );
    const socket = await promise;
    expect(() =>
      window.__urbEvent?.(
        JSON.stringify({
          channel: "websocket",
          socketId: "request-1",
          type: "ping",
        }),
      ),
    ).not.toThrow();
    expect(socket.readyState).toBe(0);
  });

  it("no-ops urb events with no listeners", () => {
    initURB();
    expect(() =>
      window.__urbEvent?.(
        JSON.stringify({
          channel: "urb",
          name: "network:statusChange",
          payload: { connected: true, type: "wifi", expensive: false },
        }),
      ),
    ).not.toThrow();
  });

  it("adds multiple listeners for the same event", () => {
    initURB();
    const h1 = vi.fn();
    const h2 = vi.fn();
    window.urb.on("deepLink:open", h1);
    window.urb.on("deepLink:open", h2);
    window.__urbEvent?.(
      JSON.stringify({
        channel: "urb",
        name: "deepLink:open",
        payload: { url: "x" },
      }),
    );
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it("keeps other listeners when one is removed", () => {
    initURB();
    const h1 = vi.fn();
    const h2 = vi.fn();
    window.urb.on("deepLink:open", h1);
    window.urb.on("deepLink:open", h2);
    window.urb.off("deepLink:open", h1);
    window.__urbEvent?.(
      JSON.stringify({
        channel: "urb",
        name: "deepLink:open",
        payload: { url: "x" },
      }),
    );
    expect(h1).not.toHaveBeenCalled();
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it("sets clipboard text without a label", async () => {
    const { bridge, messages } = createBridge();
    window.urbNative = bridge;
    initURB();
    const promise = window.urb.clipboard.setText("hello");
    await flushPromises();
    expect(messages[0]).toEqual({
      id: "request-1",
      type: "send",
      name: "clipboard:setText",
      payload: { text: "hello" },
    });
    window.__urbReceive?.(JSON.stringify({ id: "request-1", ok: true, result: {} }));
    await expect(promise).resolves.toBeUndefined();
  });

  it("transforms media:pick results into picked files", async () => {
    const { bridge } = createBridge();
    window.urbNative = bridge;
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(new Blob(["data"])),
    );
    initURB();
    const promise = window.urb.send({
      name: "media:pick",
      payload: { type: "image" },
    });
    await flushPromises();
    window.__urbReceive?.(
      JSON.stringify({
        id: "request-1",
        ok: true,
        result: {
          items: [
            {
              resourceUrl: "https://example.test/f",
              fileName: "f",
              mimeType: "text/plain",
              size: 4,
              createdAt: "2026-01-01T00:00:00Z",
            },
          ],
        },
      }),
    );
    await expect(promise).resolves.toMatchObject({
      items: [{ fileName: "f", mimeType: "text/plain", size: 4 }],
    });
  });

  it("transforms document:pick results into picked files", async () => {
    const { bridge } = createBridge();
    window.urbNative = bridge;
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(new Blob(["data"])),
    );
    initURB();
    const promise = window.urb.send({ name: "document:pick" });
    await flushPromises();
    window.__urbReceive?.(
      JSON.stringify({
        id: "request-1",
        ok: true,
        result: {
          items: [
            {
              resourceUrl: "https://example.test/d",
              fileName: "d",
              mimeType: "application/pdf",
              size: 4,
              createdAt: "2026-01-01T00:00:00Z",
            },
          ],
        },
      }),
    );
    await expect(promise).resolves.toMatchObject({
      items: [{ fileName: "d", mimeType: "application/pdf" }],
    });
  });
});
