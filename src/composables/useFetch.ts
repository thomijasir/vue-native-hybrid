import type {
  JsonValue,
  UrbFetchBody,
  UrbFetchPayload,
} from "~/lib/Urb/Urb.interface";

export type UseFetchOptions = {
  method?: string;
  headers?: HeadersInit;
  body?: UrbFetchBody;
  bodyJson?: JsonValue;
};

const normalizeHeaders = (headers?: HeadersInit): [string, string][] =>
  Array.from(new Headers(headers).entries());

const resolveNativeUrl = (input: string | URL): string => {
  const url = input.toString();

  if (typeof window === "undefined") return url;
  return new URL(url, window.location.href).href;
};

const browserRequestInit = (options: UseFetchOptions): RequestInit => {
  if (options.body !== undefined && options.bodyJson !== undefined) {
    throw new TypeError("useFetch cannot include both body and bodyJson");
  }

  const headers = new Headers(options.headers);
  let body = options.body;

  if (options.bodyJson !== undefined) {
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
    body = JSON.stringify(options.bodyJson);
  }

  return {
    method: options.method,
    headers,
    body,
  };
};

/**
 * Fetches an API endpoint or resource through the native URB bridge when it is
 * available, otherwise through the browser's standard `fetch`.
 *
 * Both transports resolve to a standard `Response`, so callers can use
 * `json()`, `text()`, `blob()`, and the usual status and header properties.
 * Relative URLs are resolved to absolute URLs before being sent to URB.
 *
 * The shared options intentionally include only values supported by both
 * transports. Use `bodyJson` to serialize JSON and add an
 * `application/json` content type automatically. Do not provide `body` and
 * `bodyJson` together.
 *
 * @param input - The absolute or relative URL of the API endpoint or resource.
 * @param options - Method, headers, and an optional raw or JSON request body.
 * @returns The response produced by URB fetch or browser fetch.
 *
 * @example
 * ```ts
 * import { useFetch } from "~/composables";
 *
 * type Profile = {
 *   id: string;
 *   name: string;
 * };
 *
 * const response = await useFetch("/api/profile", {
 *   method: "POST",
 *   bodyJson: { name: "Ada" },
 * });
 *
 * if (!response.ok) {
 *   throw new Error(`Request failed with status ${response.status}`);
 * }
 *
 * const profile = (await response.json()) as Profile;
 * ```
 *
 * @example
 * ```ts
 * const response = await useFetch("https://example.com/manual.pdf");
 * const resource = await response.blob();
 * ```
 */
export async function useFetch(
  input: string | URL,
  options: UseFetchOptions = {},
): Promise<Response> {
  if (typeof window !== "undefined" && window.urb?.isAvailable()) {
    const payload: UrbFetchPayload = {
      url: resolveNativeUrl(input),
      method: options.method,
      headers: normalizeHeaders(options.headers),
      body: options.body,
      bodyJson: options.bodyJson,
    };

    return window.urb.send({ name: "fetch", payload });
  }

  return globalThis.fetch(input, browserRequestInit(options));
}
