import type {
  ClipboardSetTextOptions,
  Urb,
  UrbErrorPayload,
  UrbEventMap,
  UrbFetchPayload,
  UrbSendCommands,
  UrbWebSocket,
  UrbWebSocketCloseEvent,
  UrbWebSocketErrorEvent,
  UrbWebSocketMessageEvent,
  UrbWebSocketOpenEvent,
  UrbWebSocketOpenPayload,
  UrbWebSocketReadyState,
  UrbWebSocketSendBody,
} from "./Urb.interface";
import { UrbError } from "./Urb.interface";
import {
  createRequestId,
  handleUnavailableFire,
  base64ToArrayBuffer,
  serializeFetchPayload,
  serializeWebSocketBody,
  serializeWebSocketOpenPayload,
  transformCameraResult,
  transformClipboardGetTextResult,
  transformFetchResult,
  transformPickFilesResult,
  transformWebSocketOpenResult,
} from "./Urb.utils";

type NativeBridge = {
  postMessage(message: string): void;
};

type UrbNativeEnvelope = {
  id?: string;
  type: "fire" | "send";
  name: string;
  payload?: unknown;
};

type UrbNativeResponse = {
  id: string;
  ok: boolean;
  result?: unknown;
  error?: UrbErrorPayload;
};

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  transform: (value: unknown) => Promise<unknown>;
};

type NativeWebSocketEvent =
  | {
      channel: "websocket";
      socketId: string;
      type: "open";
      protocol: string;
    }
  | {
      channel: "websocket";
      socketId: string;
      type: "message";
      data: string;
      binary: false;
    }
  | {
      channel: "websocket";
      socketId: string;
      type: "message";
      dataBase64: string;
      binary: true;
    }
  | {
      channel: "websocket";
      socketId: string;
      type: "closing" | "close";
      code: number;
      reason: string;
    }
  | {
      channel: "websocket";
      socketId: string;
      type: "error";
      message: string;
    };

type NativeUrbEvent<Name extends keyof UrbEventMap = keyof UrbEventMap> = {
  channel: "urb";
  name: Name;
  payload: UrbEventMap[Name];
};

type NativeEvent = NativeWebSocketEvent | NativeUrbEvent;

const pendingRequests = new Map<string, PendingRequest>();
const webSockets = new Map<string, MutableUrbWebSocket>();
const eventListeners = new Map<
  keyof UrbEventMap,
  Set<(event: never) => void>
>();

export const initURB = () => {
  window.__urbReceive = receiveNativeResponse;
  window.__urbEvent = receiveNativeEvent;
  window.urb = createUrb();
};

const createUrb = (): Urb => {
  return {
    fire(request) {
      if (!nativeBridge()) {
        handleUnavailableFire(request);
        return;
      }

      postToNative({
        type: "fire",
        name: request.name,
        payload: request.payload,
      });
    },

    send(request) {
      if (!nativeBridge()) {
        return Promise.reject(
          new UrbError({
            code: "URB_UNAVAILABLE",
            message: "Native URB bridge is not available",
          }),
        );
      }

      const id = createRequestId();
      const envelope: UrbNativeEnvelope = {
        id,
        type: "send",
        name: request.name,
      };

      const promise = new Promise<unknown>((resolve, reject) => {
        pendingRequests.set(id, {
          resolve,
          reject,
          transform: transformerFor(request.name),
        });
      });

      payloadForNative(
        request.name,
        "payload" in request ? request.payload : undefined,
      )
        .then((payload) => {
          if (payload !== undefined) {
            envelope.payload = payload;
          }

          postToNative(envelope);
        })
        .catch((error: unknown) => {
          rejectPendingRequest(
            id,
            /* c8 ignore next -- serializers only throw Error subclasses */
            error instanceof Error
              ? error
              : new UrbError({
                  code: "URB_PAYLOAD_SERIALIZATION_FAILED",
                  message: "Unable to serialize URB payload",
                }),
          );
        });

      return promise as ReturnType<Urb["send"]>;
    },

    on(name, handler) {
      const listeners = eventListeners.get(name) ?? new Set();
      listeners.add(handler as (event: never) => void);
      eventListeners.set(name, listeners);

      return () => {
        window.urb.off(name, handler);
      };
    },

    off(name, handler) {
      const listeners = eventListeners.get(name);
      if (!listeners) return;

      listeners.delete(handler as (event: never) => void);
      if (listeners.size === 0) {
        eventListeners.delete(name);
      }
    },

    websocket: {
      open(payload) {
        return openWebSocket(payload);
      },
    },

    clipboard: {
      async getText() {
        const result = await window.urb.send({
          name: "clipboard:getText",
        });
        return result.text;
      },

      async setText(text: string, options?: ClipboardSetTextOptions) {
        await window.urb.send({
          name: "clipboard:setText",
          payload: {
            text,
            ...(options?.label === undefined ? {} : { label: options.label }),
          },
        });
      },
    },

    isAvailable() {
      return Boolean(nativeBridge());
    },
  };
};

const receiveNativeResponse = (rawResponse: string) => {
  let response: UrbNativeResponse;

  try {
    response = JSON.parse(rawResponse) as UrbNativeResponse;
  } catch {
    return;
  }

  const pending = pendingRequests.get(response.id);
  if (!pending) return;

  pendingRequests.delete(response.id);

  if (!response.ok) {
    pending.reject(
      new UrbError(
        response.error ?? {
          code: "URB_UNKNOWN_ERROR",
          message: "Native URB command failed",
        },
      ),
    );
    return;
  }

  pending
    .transform(response.result)
    .then(pending.resolve)
    .catch((error: unknown) => {
      pending.reject(
        /* c8 ignore next -- transforms only throw Error subclasses */
        error instanceof Error
          ? error
          : new UrbError({
              code: "URB_RESULT_TRANSFORM_FAILED",
              message: "Unable to read native URB result",
            }),
      );
    });
};

const postToNative = (envelope: UrbNativeEnvelope) => {
  nativeBridge()?.postMessage(JSON.stringify(envelope));
};

const nativeBridge = (): NativeBridge | undefined => {
  return window.urbNative;
};

type MutableUrbWebSocket = {
  id: string;
  url: string;
  protocol: string;
  readyState: UrbWebSocketReadyState;
  onopen?: (event: UrbWebSocketOpenEvent) => void;
  onmessage?: (event: UrbWebSocketMessageEvent) => void;
  onerror?: (event: UrbWebSocketErrorEvent) => void;
  onclose?: (event: UrbWebSocketCloseEvent) => void;
  send(body: UrbWebSocketSendBody): Promise<void>;
  close(code?: number, reason?: string): Promise<void>;
};

const openWebSocket = async (
  payload: UrbWebSocketOpenPayload,
): Promise<UrbWebSocket> => {
  if (!nativeBridge()) {
    throw new UrbError({
      code: "URB_UNAVAILABLE",
      message: "Native URB bridge is not available",
    });
  }

  const socketId = createRequestId();
  const nativePayload = {
    ...payload,
    socketId,
  };
  const socket = createWebSocketHandle(socketId, payload.url);
  webSockets.set(socket.id, socket);

  try {
    const result = await window.urb.send({
      name: "websocket:open",
      payload: nativePayload,
    });

    if (result.socketId !== socketId) {
      webSockets.delete(socketId);
      throw new UrbError({
        code: "URB_INVALID_WEBSOCKET_RESULT",
        message: "Native WebSocket open result is invalid",
      });
    }

    return socket;
  } catch (error) {
    webSockets.delete(socketId);
    throw error;
  }
};

const createWebSocketHandle = (
  socketId: string,
  url: string,
): MutableUrbWebSocket => {
  const socket: MutableUrbWebSocket = {
    id: socketId,
    url,
    protocol: "",
    readyState: 0,
    async send(body) {
      if (socket.readyState === 2 || socket.readyState === 3) {
        throw new UrbError({
          code: "URB_WEBSOCKET_CLOSED",
          message: "WebSocket is not open",
        });
      }

      await window.urb.send({
        name: "websocket:send",
        payload: {
          socketId,
          body: await serializeWebSocketBody(body),
        },
      });
    },
    async close(code = 1000, reason = "") {
      if (socket.readyState === 3) return;

      socket.readyState = 2;
      await window.urb.send({
        name: "websocket:close",
        payload: {
          socketId,
          code,
          reason,
        },
      });
    },
  };

  return socket;
};

const receiveNativeEvent = (rawEvent: string) => {
  let event: NativeEvent;

  try {
    event = JSON.parse(rawEvent) as NativeEvent;
  } catch {
    return;
  }

  if (event.channel === "urb") {
    dispatchUrbEvent(event);
    return;
  }

  if (event.channel !== "websocket") return;

  const socket = webSockets.get(event.socketId);
  if (!socket) return;

  if (event.type === "open") {
    socket.readyState = 1;
    socket.protocol = event.protocol;
    socket.onopen?.({
      socketId: event.socketId,
      protocol: event.protocol,
    });
    return;
  }

  if (event.type === "message") {
    socket.onmessage?.(
      event.binary
        ? {
            socketId: event.socketId,
            data: base64ToArrayBuffer(event.dataBase64),
            binary: true,
          }
        : {
            socketId: event.socketId,
            data: event.data,
            binary: false,
          },
    );
    return;
  }

  if (event.type === "closing") {
    socket.readyState = 2;
    return;
  }

  if (event.type === "close") {
    socket.readyState = 3;
    webSockets.delete(event.socketId);
    socket.onclose?.({
      socketId: event.socketId,
      code: event.code,
      reason: event.reason,
    });
    return;
  }

  if (event.type === "error") {
    socket.onerror?.({
      socketId: event.socketId,
      message: event.message,
    });
  }
};

const dispatchUrbEvent = <Name extends keyof UrbEventMap>(
  event: NativeUrbEvent<Name>,
) => {
  const listeners = eventListeners.get(event.name);
  if (!listeners) return;

  for (const listener of Array.from(listeners)) {
    listener(event.payload as never);
  }
};

const rejectPendingRequest = (id: string, error: Error) => {
  const pending = pendingRequests.get(id);
  if (!pending) return;

  pendingRequests.delete(id);
  pending.reject(error);
};

const payloadForNative = async <Name extends keyof UrbSendCommands>(
  name: Name,
  payload: UrbSendCommands[Name]["payload"] | undefined,
): Promise<unknown> => {
  if (payload === undefined) {
    return undefined;
  }

  if (name === "fetch") {
    return serializeFetchPayload(payload as UrbFetchPayload);
  }

  if (name === "websocket:open") {
    return serializeWebSocketOpenPayload(
      payload as UrbWebSocketOpenPayload & { socketId?: string },
    );
  }

  return payload;
};

const transformerFor = <Name extends keyof UrbSendCommands>(
  name: Name,
): PendingRequest["transform"] => {
  if (name === "fetch") {
    return async (value) => transformFetchResult(value);
  }

  if (name === "websocket:open") {
    return async (value) => transformWebSocketOpenResult(value);
  }

  if (name === "websocket:send" || name === "websocket:close") {
    return async () => undefined;
  }

  if (name === "clipboard:getText") {
    return async (value) => transformClipboardGetTextResult(value);
  }

  if (name === "clipboard:setText") {
    return async () => undefined;
  }

  if (name === "camera:capture") {
    return async (value) => transformCameraResult(value);
  }

  if (name === "media:pick" || name === "document:pick") {
    return async (value) => transformPickFilesResult(value);
  }

  return async (value) => value;
};
