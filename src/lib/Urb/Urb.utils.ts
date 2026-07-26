import type {
  CameraCaptureResult,
  ClipboardGetTextResult,
  UrbFireCommands,
  UrbFetchPayload,
  UrbFireRequest,
  UrbPickedFile,
  UrbPickFilesResult,
  UrbWebSocketNativeSendBody,
  UrbWebSocketOpenPayload,
  UrbWebSocketSendBody,
} from "./Urb.interface";
import { UrbError } from "./Urb.interface";

type NativeCameraCaptureResult = {
  resourceUrl: string;
  fileName: string;
  mimeType: "image/jpeg";
  size: number;
  createdAt: string;
};

type NativePickedFileResult = {
  resourceUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

type NativePickFilesResult = {
  items: NativePickedFileResult[];
};

type NativeFetchPayload = {
  url: string;
  method?: string;
  headers: [string, string][];
  body: NativeFetchBody;
};

type NativeFetchBody =
  | { kind: "empty" }
  | { kind: "text"; value: string }
  | { kind: "base64"; mimeType?: string; value: string }
  | { kind: "multipart"; parts: NativeMultipartPart[] };

type NativeMultipartPart =
  | { kind: "text"; name: string; value: string }
  | {
      kind: "file";
      name: string;
      fileName: string;
      mimeType: string;
      bodyBase64: string;
    };

type NativeFetchResult = {
  status: number;
  statusText: string;
  headers: [string, string][];
  bodyBase64: string;
  url: string;
};

type NativeWebSocketOpenPayload = {
  socketId: string;
  url: string;
  headers: [string, string][];
  protocols: string[];
};

type NativeWebSocketOpenResult = {
  socketId: string;
};

export const transformCameraResult = async (
  value: unknown,
): Promise<CameraCaptureResult> => {
  const result = value as Partial<NativeCameraCaptureResult>;

  if (
    typeof result.resourceUrl !== "string" ||
    typeof result.fileName !== "string" ||
    result.mimeType !== "image/jpeg" ||
    typeof result.size !== "number" ||
    typeof result.createdAt !== "string"
  ) {
    throw new UrbError({
      code: "URB_INVALID_CAMERA_RESULT",
      message: "Native camera result is invalid",
    });
  }

  const file = await fetchNativeFile(result as NativePickedFileResult);

  return {
    file,
    fileName: result.fileName,
    mimeType: result.mimeType,
    size: result.size,
    createdAt: result.createdAt,
  };
};

export const transformPickFilesResult = async (
  value: unknown,
): Promise<UrbPickFilesResult> => {
  const result = value as Partial<NativePickFilesResult>;

  if (!Array.isArray(result.items) || result.items.length === 0) {
    throw new UrbError({
      code: "URB_INVALID_PICKER_RESULT",
      message: "Native picker result is invalid",
    });
  }

  const items: UrbPickedFile[] = [];

  for (const item of result.items) {
    validateNativePickedFile(item);
    const file = await fetchNativeFile(item);
    items.push({
      file,
      fileName: item.fileName,
      mimeType: item.mimeType,
      size: item.size,
      createdAt: item.createdAt,
    });
  }

  return {
    files: items.map((item) => item.file),
    items,
  };
};

export const transformClipboardGetTextResult = async (
  value: unknown,
): Promise<ClipboardGetTextResult> => {
  const result = value as Partial<ClipboardGetTextResult>;

  if (typeof result.text !== "string") {
    throw new UrbError({
      code: "URB_INVALID_CLIPBOARD_RESULT",
      message: "Native clipboard result is invalid",
    });
  }

  return {
    text: result.text,
  };
};

export const serializeWebSocketOpenPayload = (
  payload: UrbWebSocketOpenPayload & { socketId?: string },
): NativeWebSocketOpenPayload => {
  if (typeof payload.url !== "string" || payload.url.trim() === "") {
    throw new UrbError({
      code: "URB_INVALID_WEBSOCKET_PAYLOAD",
      message: "WebSocket open payload requires a URL",
    });
  }

  return {
    socketId:
      typeof payload.socketId === "string" && payload.socketId.trim() !== ""
        ? payload.socketId
        : createRequestId(),
    url: payload.url,
    headers: normalizeWebSocketHeaders(payload.headers),
    protocols: payload.protocols ?? [],
  };
};

export const transformWebSocketOpenResult = async (
  value: unknown,
): Promise<NativeWebSocketOpenResult> => {
  const result = value as Partial<NativeWebSocketOpenResult>;

  if (typeof result.socketId !== "string" || result.socketId.trim() === "") {
    throw new UrbError({
      code: "URB_INVALID_WEBSOCKET_RESULT",
      message: "Native WebSocket open result is invalid",
    });
  }

  return {
    socketId: result.socketId,
  };
};

export const serializeWebSocketBody = async (
  body: UrbWebSocketSendBody,
): Promise<UrbWebSocketNativeSendBody> => {
  if (typeof body === "string") {
    return {
      kind: "text",
      value: body,
    };
  }

  if (body instanceof Blob) {
    return {
      kind: "base64",
      value: arrayBufferToBase64(await body.arrayBuffer()),
    };
  }

  if (body instanceof ArrayBuffer) {
    return {
      kind: "base64",
      value: arrayBufferToBase64(body),
    };
  }

  if (ArrayBuffer.isView(body)) {
    return {
      kind: "base64",
      value: arrayBufferToBase64(viewToArrayBuffer(body)),
    };
  }

  throw new UrbError({
    code: "URB_INVALID_WEBSOCKET_PAYLOAD",
    message: "WebSocket message body type is not supported",
  });
};

export const serializeFetchPayload = async (
  payload: UrbFetchPayload,
): Promise<NativeFetchPayload> => {
  if (typeof payload.url !== "string" || payload.url.trim() === "") {
    throw new UrbError({
      code: "URB_INVALID_FETCH_PAYLOAD",
      message: "Fetch payload requires a URL",
    });
  }

  if (payload.bodyJson !== undefined && payload.body !== undefined) {
    throw new UrbError({
      code: "URB_INVALID_FETCH_PAYLOAD",
      message: "Fetch payload cannot include both bodyJson and body",
    });
  }

  const headers = normalizeFetchHeaders(payload.headers);
  const body =
    payload.bodyJson !== undefined
      ? serializeJsonBody(payload.bodyJson, headers)
      : await serializeFetchBody(payload.body);

  return {
    url: payload.url,
    method: payload.method,
    headers,
    body,
  };
};

export const transformFetchResult = async (
  value: unknown,
): Promise<Response> => {
  const result = value as Partial<NativeFetchResult>;

  if (
    typeof result.status !== "number" ||
    typeof result.statusText !== "string" ||
    !Array.isArray(result.headers) ||
    typeof result.bodyBase64 !== "string" ||
    typeof result.url !== "string"
  ) {
    throw new UrbError({
      code: "URB_INVALID_FETCH_RESULT",
      message: "Native fetch result is invalid",
    });
  }

  const headers = new Headers();
  for (const header of result.headers) {
    if (
      Array.isArray(header) &&
      typeof header[0] === "string" &&
      typeof header[1] === "string"
    ) {
      headers.append(header[0], header[1]);
    }
  }

  const nativeResult: NativeFetchResult = {
    status: result.status,
    statusText: result.statusText,
    headers: result.headers,
    bodyBase64: result.bodyBase64,
    url: result.url,
  };

  return new Response(responseBodyFor(nativeResult), {
    status: nativeResult.status,
    statusText: nativeResult.statusText,
    headers,
  });
};

function validateNativePickedFile(
  item: unknown,
): asserts item is NativePickedFileResult {
  const result = item as Partial<NativePickedFileResult>;

  if (
    typeof result.resourceUrl !== "string" ||
    typeof result.fileName !== "string" ||
    typeof result.mimeType !== "string" ||
    typeof result.size !== "number" ||
    typeof result.createdAt !== "string"
  ) {
    throw new UrbError({
      code: "URB_INVALID_PICKER_RESULT",
      message: "Native picker item is invalid",
    });
  }
}

const fetchNativeFile = async (
  result: NativePickedFileResult,
): Promise<File> => {
  let response: Response;

  try {
    response = await fetch(result.resourceUrl, {
      cache: "no-store",
    });
  } catch {
    throw new UrbError({
      code: "URB_RESOURCE_FETCH_FAILED",
      message: "Unable to read native file resource",
    });
  }

  if (!response.ok) {
    throw new UrbError({
      code: "URB_RESOURCE_FETCH_FAILED",
      message: "Unable to read native file resource",
    });
  }

  const blob = await response.blob();
  return new File([blob], result.fileName, {
    type: result.mimeType,
    lastModified: Date.parse(result.createdAt),
  });
};

export const handleUnavailableFire = <Name extends keyof UrbFireCommands>(
  request: UrbFireRequest<Name>,
) => {
  if (request.name === "toast") {
    const payload = request.payload as UrbFireCommands["toast"]["payload"];
    console.info("[URB toast]", payload.text);
    return;
  }

  if (request.name === "intent:open") {
    const payload =
      request.payload as UrbFireCommands["intent:open"]["payload"];
    console.info("[URB intent]", payload.target);
    return;
  }

  if (request.name === "browser:open") {
    const payload =
      request.payload as UrbFireCommands["browser:open"]["payload"];
    console.info("[URB browser]", payload.url, payload.mode ?? "external");
  }
};

export const createRequestId = () => {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `urb-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
};

const normalizeWebSocketHeaders = (
  headers: UrbWebSocketOpenPayload["headers"],
): [string, string][] => {
  if (headers === undefined) return [];

  if (Array.isArray(headers)) {
    return headers.map(([name, value]) => [name, value]);
  }

  return Object.entries(headers);
};

const normalizeFetchHeaders = (
  headers: UrbFetchPayload["headers"],
): [string, string][] => {
  if (headers === undefined) return [];

  if (Array.isArray(headers)) {
    return headers.map(([name, value]) => [name, value]);
  }

  return Object.entries(headers);
};

const serializeJsonBody = (
  value: UrbFetchPayload["bodyJson"],
  headers: [string, string][],
): NativeFetchBody => {
  if (!hasHeader(headers, "content-type")) {
    headers.push(["content-type", "application/json"]);
  }

  return {
    kind: "text",
    value: JSON.stringify(value),
  };
};

const serializeFetchBody = async (
  body: UrbFetchPayload["body"],
): Promise<NativeFetchBody> => {
  if (body === undefined) {
    return { kind: "empty" };
  }

  if (typeof body === "string") {
    return {
      kind: "text",
      value: body,
    };
  }

  if (body instanceof FormData) {
    return serializeFormDataBody(body);
  }

  if (body instanceof Blob) {
    return {
      kind: "base64",
      mimeType: body.type || undefined,
      value: arrayBufferToBase64(await body.arrayBuffer()),
    };
  }

  if (body instanceof ArrayBuffer) {
    return {
      kind: "base64",
      value: arrayBufferToBase64(body),
    };
  }

  if (ArrayBuffer.isView(body)) {
    return {
      kind: "base64",
      value: arrayBufferToBase64(viewToArrayBuffer(body)),
    };
  }

  throw new UrbError({
    code: "URB_INVALID_FETCH_PAYLOAD",
    message: "Fetch body type is not supported",
  });
};

const serializeFormDataBody = async (
  formData: FormData,
): Promise<NativeFetchBody> => {
  const parts: NativeMultipartPart[] = [];

  for (const [name, value] of formData.entries()) {
    if (typeof value === "string") {
      parts.push({
        kind: "text",
        name,
        value,
      });
      continue;
    }

    parts.push({
      kind: "file",
      name,
      /* c8 ignore next -- FormData entries are always File values */
      fileName: value instanceof File ? value.name : "blob",
      mimeType: value.type || "application/octet-stream",
      bodyBase64: arrayBufferToBase64(await value.arrayBuffer()),
    });
  }

  return {
    kind: "multipart",
    parts,
  };
};

const hasHeader = (
  headers: [string, string][],
  headerName: string,
): boolean => {
  const normalized = headerName.toLowerCase();
  return headers.some(([name]) => name.toLowerCase() === normalized);
};

const responseBodyFor = (result: NativeFetchResult): BodyInit | null => {
  if (result.bodyBase64 === "" || [204, 205, 304].includes(result.status)) {
    return null;
  }

  return base64ToArrayBuffer(result.bodyBase64);
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
};

const viewToArrayBuffer = (view: ArrayBufferView): ArrayBuffer => {
  const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
};
