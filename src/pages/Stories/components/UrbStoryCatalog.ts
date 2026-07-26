import type { StoriesLayoutProps } from "~/layouts/Stories/Stories.interface";

type ApiRow = [name: string, kind: string, description: string];

export type UrbStoryDefinition = {
  meta: StoriesLayoutProps;
  sample: string;
  action?: string;
  live?: boolean;
  note?: string;
};

const api = (rows: ApiRow[]) => ({
  columns: [
    { key: "name", label: "Name" },
    { key: "kind", label: "Kind" },
    { key: "description", label: "Description" },
  ],
  rows: rows.map(([name, kind, description]) => ({ name, kind, description })),
});

const define = (
  name: string,
  description: string,
  usageCode: string,
  whenToUse: string[],
  rows: ApiRow[],
  sample: string,
  options: Pick<UrbStoryDefinition, "action" | "live" | "note"> = {},
): UrbStoryDefinition => ({
  meta: {
    name,
    category: "urb",
    description,
    usageCode,
    whenToUse,
    api: api(rows),
  },
  sample,
  live: true,
  ...options,
});

const unavailableError: ApiRow = [
  "URB_UNAVAILABLE",
  "error",
  "The page is running without the native bridge.",
];

export const urbStoryCatalog = {
  mediaPick: define(
    "Media Pick",
    'The "media:pick" command opens the native photo library and returns selected images or videos as browser File objects.',
    `const result = await window.urb.send({
  name: "media:pick",
  payload: { multiple: true, type: "image", maxItems: 5 },
});

result.files.forEach((file) => upload(file));`,
    [
      "Selecting existing photos or videos from the native media library.",
      "When uploaded content must be returned as browser File objects.",
      "Selection is limited to 20 items by the native implementations.",
    ],
    [
      [
        "multiple",
        "param",
        "Allows more than one selection; defaults to false.",
      ],
      ["type", "param", '"image", "video", or "imageAndVideo" (default).'],
      ["maxItems", "param", "Maximum returned items; clamped to 1–20."],
      ["compression", "param", "Optional image compression settings."],
      ["files", "result", "The selected browser File objects."],
      [
        "items",
        "result",
        "Files with name, MIME type, size, and timestamp metadata.",
      ],
      [
        "MEDIA_PICKER_CANCELLED",
        "error",
        "The picker closed without a selection.",
      ],
      unavailableError,
    ],
    `{
  "files": [File],
  "items": [{
    "file": File,
    "fileName": "urb-media-….jpg",
    "mimeType": "image/jpeg",
    "size": 245760,
    "createdAt": "2026-07-26T10:00:00Z"
  }]
}`,
    { action: "Pick media" },
  ),
  documentPick: define(
    "Document Pick",
    'The "document:pick" command opens the system document picker and returns selected documents as browser File objects.',
    `const result = await window.urb.send({
  name: "document:pick",
  payload: { multiple: true, mimeTypes: ["application/pdf"], maxItems: 5 },
});`,
    [
      "Importing PDFs, office documents, or other files.",
      "Restricting the picker to one or more MIME types.",
      "Use the returned File immediately; native resource URLs are one-time resources.",
    ],
    [
      ["multiple", "param", "Allows multiple selection; defaults to false."],
      [
        "mimeTypes",
        "param",
        "Accepted MIME types; all documents when omitted.",
      ],
      [
        "maxItems",
        "param",
        "Maximum selected documents, clamped by native code.",
      ],
      ["files", "result", "Selected browser File objects."],
      ["items", "result", "File metadata paired with each File."],
      ["DOCUMENT_PICKER_CANCELLED", "error", "The user cancelled the picker."],
      unavailableError,
    ],
    `{
  "files": [File],
  "items": [{
    "fileName": "statement.pdf",
    "mimeType": "application/pdf",
    "size": 98304,
    "createdAt": "2026-07-26T10:00:00Z"
  }]
}`,
    { action: "Pick a PDF" },
  ),
  locationCurrent: define(
    "Location Current",
    'The "location:current" command reads the device location with a requested accuracy and timeout.',
    `const location = await window.urb.send({
  name: "location:current",
  payload: { accuracy: "fine", timeoutMs: 15000 },
});`,
    [
      "Getting a current coordinate after explaining why location is needed.",
      "Use coarse accuracy when precise positioning is unnecessary.",
      "Handle permission denial and timeouts as normal outcomes.",
    ],
    [
      [
        "accuracy",
        "param",
        '"fine" or "coarse"; defaults to platform behavior.',
      ],
      ["timeoutMs", "param", "Maximum wait for a location fix."],
      ["latitude / longitude", "result", "Coordinates in decimal degrees."],
      [
        "accuracyMeters",
        "result",
        "Reported horizontal accuracy when available.",
      ],
      ["provider", "result", '"gps", "network", "passive", or "unknown".'],
      ["capturedAt", "result", "ISO 8601 capture timestamp."],
      ["LOCATION_PERMISSION_DENIED", "error", "Location access was denied."],
      unavailableError,
    ],
    `{
  "latitude": 1.3521,
  "longitude": 103.8198,
  "accuracyMeters": 12,
  "provider": "gps",
  "capturedAt": "2026-07-26T10:00:00Z"
}`,
    { action: "Get current location" },
  ),
  locationPick: define(
    "Location Pick",
    'The "location:pick" command presents a native map picker and returns the coordinate confirmed by the user.',
    `const picked = await window.urb.send({
  name: "location:pick",
  payload: {
    initialLocation: { latitude: 1.3521, longitude: 103.8198 },
    accuracy: "fine",
  },
});`,
    [
      "Letting a user confirm or adjust a map position.",
      "Choosing delivery, meeting, or service locations.",
      "Prefer this over silently persisting a background location.",
    ],
    [
      [
        "initialLocation",
        "param",
        "Optional coordinate used to center the picker.",
      ],
      ["accuracy", "param", '"fine" or "coarse".'],
      ["timeoutMs", "param", "Maximum wait used while resolving location."],
      ["latitude / longitude", "result", "The confirmed coordinate."],
      ["pickedAt", "result", "ISO 8601 confirmation timestamp."],
      ["LOCATION_PICKER_CANCELLED", "error", "The picker was cancelled."],
      unavailableError,
    ],
    `{
  "latitude": 1.3521,
  "longitude": 103.8198,
  "accuracyMeters": 18,
  "pickedAt": "2026-07-26T10:00:00Z"
}`,
    { action: "Pick a location" },
  ),
  intentOpen: define(
    "Intent Open",
    'The fire-and-forget "intent:open" command opens a supported native target without returning a result.',
    `window.urb.fire({
  name: "intent:open",
  payload: { target: "appSettings" },
});`,
    [
      "Opening this app's system settings after a denied permission.",
      "Presenting the iOS share sheet with text or URL extras.",
      "Use openForResult when the caller must know whether an activity completed.",
    ],
    [
      [
        "target",
        "param",
        '"appSettings", "mapLocationPicker", or iOS "shareSheet".',
      ],
      [
        "extras",
        "param",
        "String, number, boolean, or null values for the target.",
      ],
      ["return", "result", "None; fire commands do not return a Promise."],
      [
        "command:error",
        "event",
        "iOS reports fire-command failures through this event.",
      ],
    ],
    `{ "dispatched": true, "target": "appSettings" }`,
    { action: "Open app settings" },
  ),
  intentOpenForResult: define(
    "Intent Open for Result",
    'The "intent:openForResult" command launches a supported native target and resolves after it completes or is cancelled.',
    `const result = await window.urb.send({
  name: "intent:openForResult",
  payload: { target: "mapLocationPicker" },
});`,
    [
      "Launching a native activity whose completion matters to web code.",
      "Inspect resultCode instead of treating user cancellation as an exception.",
      "Target availability differs by platform; handle unsupported targets.",
    ],
    [
      ["target", "param", "Native target to launch."],
      ["extras", "param", "Target-specific primitive values."],
      ["resultCode", "result", '"ok" or "cancelled".'],
      ["extras", "result", "Values returned by the native target."],
      [
        "INTENT_TARGET_UNSUPPORTED_MODE",
        "error",
        "Target cannot return a result on this platform.",
      ],
      unavailableError,
    ],
    `{
  "resultCode": "ok",
  "extras": { "latitude": 1.3521, "longitude": 103.8198 }
}`,
    { action: "Open location picker" },
  ),
  browserOpen: define(
    "Browser Open",
    'The fire-and-forget "browser:open" command opens an HTTP(S) URL externally or in an in-app browser.',
    `window.urb.fire({
  name: "browser:open",
  payload: { url: "https://example.com", mode: "inApp" },
});`,
    [
      "Opening trusted web content outside the embedded application page.",
      "Use inApp when the user should return without switching applications.",
      "Only HTTP and HTTPS URLs are accepted.",
    ],
    [
      ["url", "param", "Required absolute HTTP or HTTPS URL."],
      ["mode", "param", '"external" (default) or "inApp".'],
      [
        "return",
        "result",
        "None; failures may be reported as command:error on iOS.",
      ],
      ["BROWSER_URL_INVALID", "error", "URL is not a permitted HTTP(S) URL."],
    ],
    `{ "dispatched": true, "url": "https://example.com", "mode": "inApp" }`,
    { action: "Open example.com" },
  ),
  permissionsGet: define(
    "Permissions Get",
    'The "permissions:get" command reports current states without showing a system permission prompt.',
    `const states = await window.urb.send({
  name: "permissions:get",
  payload: { names: ["camera", "location:fine"] },
});`,
    [
      "Checking permission state before deciding what UI to show.",
      "Explaining restricted or undeclared capabilities.",
      "This command does not request or mutate permission state.",
    ],
    [
      [
        "names",
        "param",
        "Optional permission names; omission returns the full catalog.",
      ],
      [
        "status",
        "result",
        "granted, denied, prompt, restricted, limited, notRequired, or notDeclared.",
      ],
      ["granted", "result", "Convenience boolean."],
      ["shouldShowRationale", "result", "Android rationale recommendation."],
      [
        "androidPermissions",
        "result",
        "Underlying Android permission strings.",
      ],
      unavailableError,
    ],
    `[{
  "name": "camera",
  "status": "prompt",
  "granted": false,
  "shouldShowRationale": false,
  "androidPermissions": ["android.permission.CAMERA"]
}]`,
    { action: "Check camera permission" },
  ),
  permissionsRequest: define(
    "Permissions Request",
    'The "permissions:request" command explicitly asks for one or more native permissions and returns their resulting states.',
    `const states = await window.urb.send({
  name: "permissions:request",
  payload: { names: ["camera"] },
});`,
    [
      "Requesting a permission immediately before a user-triggered capability.",
      "Always explain the benefit before displaying the system prompt.",
      "Treat denial as a supported result rather than repeatedly prompting.",
    ],
    [
      ["names", "param", "Required non-empty list of URB permission names."],
      [
        "PermissionState[]",
        "result",
        "The state of every requested permission.",
      ],
      ["PERMISSIONS_BUSY", "error", "Another request is already active."],
      ["PERMISSIONS_INVALID_PAYLOAD", "error", "No valid names were supplied."],
      unavailableError,
    ],
    `[{
  "name": "camera",
  "status": "granted",
  "granted": true,
  "shouldShowRationale": false,
  "androidPermissions": ["android.permission.CAMERA"]
}]`,
    { action: "Request camera permission" },
  ),
  clipboardGetText: define(
    "Clipboard Get Text",
    'The "clipboard:getText" command reads text from the native clipboard. The convenience helper returns the string directly.',
    `const text = await window.urb.clipboard.getText();

// Equivalent low-level command:
const result = await window.urb.send({ name: "clipboard:getText" });`,
    [
      "Pasting text after an explicit user action.",
      "Avoid reading clipboard contents automatically or logging sensitive values.",
      "The demo reports only length and a masked preview.",
    ],
    [
      ["payload", "param", "None."],
      ["text", "result", "Clipboard text; the helper unwraps this field."],
      [
        "URB_INVALID_CLIPBOARD_RESULT",
        "error",
        "Native result did not contain text.",
      ],
      unavailableError,
    ],
    `{ "characters": 18, "preview": "••••••••" }`,
    { action: "Read clipboard safely" },
  ),
  clipboardSetText: define(
    "Clipboard Set Text",
    'The "clipboard:setText" command writes text to the native clipboard. A convenience helper accepts text and an optional Android label.',
    `await window.urb.clipboard.setText("Hello from URB", {
  label: "URB story demo",
});`,
    [
      "Copy buttons for identifiers, links, or user-visible text.",
      "Use a meaningful label on Android when appropriate.",
      "Only write after an explicit user action.",
    ],
    [
      ["text", "param", "Required clipboard text."],
      ["label", "param", "Optional Android clipboard description."],
      ["return", "result", "Promise<void>."],
      [
        "URB_INVALID_CLIPBOARD_PAYLOAD",
        "error",
        "Text was missing or invalid.",
      ],
      unavailableError,
    ],
    `{ "copied": true, "characters": 14 }`,
    { action: "Copy safe demo text" },
  ),
  deviceInfo: define(
    "Device Info",
    'The "device:info" command returns normalized platform, OS, application, locale, and hardware information.',
    `const device = await window.urb.send({ name: "device:info" });`,
    [
      "Diagnostics and support screens.",
      "Feature decisions that genuinely depend on OS or SDK level.",
      "Do not use hardware fields as a stable user identifier.",
    ],
    [
      ["platform", "result", '"android" or "ios".'],
      ["osName / osVersion", "result", "Operating system identity."],
      [
        "model / manufacturer / brand",
        "result",
        "Platform-dependent hardware metadata.",
      ],
      [
        "appId / appVersionName / appVersionCode",
        "result",
        "Installed application metadata.",
      ],
      ["buildType", "result", '"debug" or "release".'],
      ["locale / timeZone", "result", "Current device regional settings."],
      unavailableError,
    ],
    `{
  "platform": "ios",
  "osName": "iOS",
  "osVersion": "18.5",
  "model": "iPhone",
  "appId": "com.example.app",
  "appVersionName": "1.0",
  "appVersionCode": 1,
  "buildType": "debug",
  "locale": "en-SG",
  "timeZone": "Asia/Singapore"
}`,
    { action: "Read device info" },
  ),
  secureStorageSet: define(
    "Secure Storage Set",
    'The "secureStorage:set" command stores a string in platform-protected storage.',
    `await window.urb.send({
  name: "secureStorage:set",
  payload: { key: "session-token", value: token },
});`,
    [
      "Persisting small secrets such as refresh tokens.",
      "Values are strings; serialize structured data deliberately.",
      "The demo writes only to the namespaced key urb.story.demo.",
    ],
    [
      ["key", "param", "Required non-empty storage key."],
      ["value", "param", "Required string value."],
      ["return", "result", "Promise<void>."],
      [
        "URB_SECURE_STORAGE_WRITE_FAILED",
        "error",
        "Protected storage rejected the write.",
      ],
      unavailableError,
    ],
    `{ "stored": true, "key": "urb.story.demo" }`,
    { action: "Store demo value" },
  ),
  secureStorageGet: define(
    "Secure Storage Get",
    'The "secureStorage:get" command reads a string from platform-protected storage.',
    `const { value } = await window.urb.send({
  name: "secureStorage:get",
  payload: { key: "session-token" },
});`,
    [
      "Restoring a previously stored secret.",
      "A missing key resolves with null rather than throwing.",
      "Never display secret values in diagnostics or logs.",
    ],
    [
      ["key", "param", "Required storage key."],
      ["value", "result", "Stored string, or null when absent."],
      ["URB_INVALID_SECURE_STORAGE_PAYLOAD", "error", "The key was missing."],
      unavailableError,
    ],
    `{ "value": "••••••••" }`,
    { action: "Read demo key" },
  ),
  secureStorageDelete: define(
    "Secure Storage Delete",
    'The "secureStorage:delete" command removes one protected value without affecting other keys.',
    `await window.urb.send({
  name: "secureStorage:delete",
  payload: { key: "session-token" },
});`,
    [
      "Removing a token during sign-out or account reset.",
      "Prefer deleting a known key over clearing the entire store.",
      "The demo can only delete urb.story.demo.",
    ],
    [
      ["key", "param", "Required storage key."],
      ["return", "result", "Promise<void>; deleting an absent key is safe."],
      [
        "URB_SECURE_STORAGE_WRITE_FAILED",
        "error",
        "Protected storage rejected deletion.",
      ],
      unavailableError,
    ],
    `{ "deleted": true, "key": "urb.story.demo" }`,
    { action: "Delete demo key" },
  ),
  secureStorageClear: define(
    "Secure Storage Clear",
    'The "secureStorage:clear" command irreversibly removes every value owned by URB protected storage.',
    `// Destructive: normally use secureStorage:delete for a known key.
await window.urb.send({ name: "secureStorage:clear" });`,
    [
      "Full application reset or explicit account-data removal.",
      "Do not expose this as a casual debugging action.",
      "This story intentionally has no live action.",
    ],
    [
      ["payload", "param", "None."],
      ["return", "result", "Promise<void>."],
      [
        "URB_SECURE_STORAGE_WRITE_FAILED",
        "error",
        "Protected storage could not be cleared.",
      ],
      unavailableError,
    ],
    `{ "cleared": true }`,
    {
      live: false,
      note: "The live action is disabled because it would delete all URB protected values. Use secureStorage:delete for scoped cleanup.",
    },
  ),
  biometricsGetAvailability: define(
    "Biometrics Availability",
    'The "biometrics:getAvailability" command checks hardware support and enrollment without displaying an authentication prompt.',
    `const availability = await window.urb.send({
  name: "biometrics:getAvailability",
});`,
    [
      "Deciding whether to offer biometric sign-in.",
      "Explaining why biometric authentication is unavailable.",
      "Check again after returning from system settings.",
    ],
    [
      ["available", "result", "True when authentication can be attempted now."],
      [
        "enrolled",
        "result",
        "True when the user enrolled a supported biometric.",
      ],
      ["supported", "result", "True when device hardware supports biometrics."],
      ["reason", "result", "Optional platform explanation."],
      unavailableError,
    ],
    `{
  "available": true,
  "enrolled": true,
  "supported": true
}`,
    { action: "Check biometrics" },
  ),
  biometricsAuthenticate: define(
    "Biometrics Authenticate",
    'The "biometrics:authenticate" command shows the native biometric prompt and resolves only after successful authentication.',
    `const result = await window.urb.send({
  name: "biometrics:authenticate",
  payload: { reason: "Confirm this sensitive action" },
});`,
    [
      "Re-authenticating before sensitive application actions.",
      "Only call from an explicit user gesture.",
      "Treat cancellation and authentication failure as expected outcomes.",
    ],
    [
      ["reason", "param", "Optional explanation shown in the native prompt."],
      ["authenticated", "result", "Always true on successful resolution."],
      ["URB_BIOMETRICS_UNAVAILABLE", "error", "Biometrics cannot be used."],
      [
        "URB_BIOMETRICS_AUTH_FAILED",
        "error",
        "Authentication failed or was cancelled.",
      ],
      unavailableError,
    ],
    `{ "authenticated": true }`,
    { action: "Authenticate" },
  ),
  deepLinkGetInitial: define(
    "Deep Link Get Initial",
    'The Android-only "deepLink:getInitial" command returns the URL that launched the current native activity, if any.',
    `const { url } = await window.urb.send({
  name: "deepLink:getInitial",
});`,
    [
      "Restoring navigation from the URL that cold-started the Android app.",
      "Call once during application bootstrap, then listen for deepLink:open.",
      "Currently unavailable in the iOS bridge.",
    ],
    [
      ["payload", "param", "None."],
      ["url", "result", "Initial deep link string, or null."],
      [
        "platform",
        "availability",
        "Android only in the current native implementations.",
      ],
      [
        "URB_UNKNOWN_COMMAND",
        "error",
        "Returned by iOS because the command is not registered.",
      ],
      unavailableError,
    ],
    `{ "url": "myapp://orders/123" }`,
    { action: "Read initial deep link" },
  ),
  networkGetStatus: define(
    "Network Get Status",
    'The "network:getStatus" command returns the native connectivity snapshot.',
    `const status = await window.urb.send({
  name: "network:getStatus",
});`,
    [
      "Showing offline UI before starting an operation.",
      "Use network:statusChange for subsequent updates.",
      "Connectivity does not guarantee a particular server is reachable.",
    ],
    [
      ["connected", "result", "Whether a network path is currently available."],
      ["type", "result", "wifi, cellular, ethernet, vpn, none, or unknown."],
      [
        "expensive",
        "result",
        "Whether the path may be metered or constrained.",
      ],
      unavailableError,
    ],
    `{
  "connected": true,
  "type": "wifi",
  "expensive": false
}`,
    { action: "Get network status" },
  ),
  fetch: define(
    "Native Fetch",
    'The "fetch" command performs an allowlisted native HTTP request and converts the response into a standard browser Response.',
    `const response = await window.urb.send({
  name: "fetch",
  payload: {
    url: "https://jsonplaceholder.typicode.com/todos/1",
    method: "GET",
  },
});

const data = await response.json();`,
    [
      "Calling an allowlisted service through the native networking stack.",
      "Debug builds allow JSONPlaceholder; release allowlists are currently empty.",
      "Responses and request bodies are limited to 5 MB.",
    ],
    [
      ["url", "param", "Required allowlisted HTTP(S) URL."],
      ["method", "param", "Optional HTTP method."],
      ["headers", "param", "Headers object, Headers, or tuple array."],
      [
        "bodyJson",
        "param",
        "JSON value serialized with an appropriate content type.",
      ],
      [
        "body",
        "param",
        "String, Blob, buffers, typed arrays, or FormData; mutually exclusive with bodyJson.",
      ],
      ["Response", "result", "Standard browser Response object."],
      ["FETCH_RESPONSE_TOO_LARGE", "error", "Response exceeded 5 MB."],
      unavailableError,
    ],
    `{
  "status": 200,
  "ok": true,
  "body": {
    "userId": 1,
    "id": 1,
    "title": "delectus aut autem",
    "completed": false
  }
}`,
    { action: "Fetch sample todo" },
  ),
  websocketOpen: define(
    "WebSocket Open",
    'The "websocket:open" route creates a native WebSocket. Prefer the high-level helper, which returns a browser-like socket handle.',
    `const socket = await window.urb.websocket.open({
  url: "wss://your-allowlisted-host.example/socket",
  protocols: ["v1"],
});

socket.onopen = () => console.log("connected");`,
    [
      "Native WebSocket connections to explicitly allowlisted hosts.",
      "Use the returned handle instead of manually managing socket IDs.",
      "Release builds currently have an empty host allowlist.",
    ],
    [
      ["url", "param", "Required allowlisted ws:// or wss:// URL."],
      ["headers", "param", "Optional native handshake headers."],
      ["protocols", "param", "Optional WebSocket subprotocols."],
      [
        "UrbWebSocket",
        "result",
        "High-level socket handle with events, send, and close.",
      ],
      ["WEBSOCKET_INVALID_PAYLOAD", "error", "URL or options were invalid."],
      unavailableError,
    ],
    `{
  "id": "urb-…",
  "url": "wss://example.test/socket",
  "protocol": "",
  "readyState": 0
}`,
    { action: "Open socket" },
  ),
  websocketSend: define(
    "WebSocket Send",
    'The "websocket:send" route sends text or base64-encoded binary data through a native socket. The socket handle serializes browser data types automatically.',
    `const socket = await window.urb.websocket.open({ url });
socket.onopen = async () => {
  await socket.send("Hello from URB");
};`,
    [
      "Sending text, Blob, ArrayBuffer, or typed-array messages.",
      "Prefer socket.send() so binary values are serialized correctly.",
      "The live demo opens a socket first and always closes it during cleanup.",
    ],
    [
      ["socketId", "low-level param", "ID returned by websocket:open."],
      [
        "body",
        "low-level param",
        'Native { kind: "text" | "base64", value } payload.',
      ],
      [
        "socket.send(body)",
        "helper",
        "Accepts string, Blob, ArrayBuffer, or ArrayBufferView.",
      ],
      ["WEBSOCKET_SEND_FAILED", "error", "Native socket rejected the message."],
      unavailableError,
    ],
    `{ "sent": true, "body": "Hello from URB" }`,
    { action: "Open and send" },
  ),
  websocketClose: define(
    "WebSocket Close",
    'The "websocket:close" route closes a native WebSocket. Prefer close() on the returned socket handle.',
    `await socket.close(1000, "Finished");`,
    [
      "Closing sockets when a screen or session ends.",
      "Use standard close code 1000 for normal completion.",
      "Component cleanup should close any socket that remains open.",
    ],
    [
      ["socketId", "low-level param", "Socket to close."],
      [
        "code",
        "param",
        "Optional WebSocket close code; helper defaults to 1000.",
      ],
      ["reason", "param", "Optional close reason."],
      ["return", "result", "Promise<void>."],
      [
        "WEBSOCKET_CLOSE_FAILED",
        "error",
        "Native socket rejected the close request.",
      ],
      unavailableError,
    ],
    `{ "closed": true, "code": 1000, "reason": "Finished" }`,
    { action: "Open and close" },
  ),
  toast: define(
    "Toast",
    'The Android-only fire-and-forget "toast" command displays a short native toast. Browser preview logs the text.',
    `window.urb.fire({
  name: "toast",
  payload: { text: "Saved successfully" },
});`,
    [
      "Brief, non-critical Android feedback.",
      "Do not use a toast for errors requiring action or for persistent information.",
      "Currently not registered by the iOS bridge.",
    ],
    [
      ["text", "param", "Required message shown by Android."],
      ["return", "result", "None."],
      [
        "platform",
        "availability",
        "Android only; the web fallback logs to the console.",
      ],
      [
        "URB_UNKNOWN_COMMAND",
        "event",
        "iOS reports the missing fire command via command:error.",
      ],
    ],
    `{ "dispatched": true, "text": "Saved successfully" }`,
    { action: "Show toast" },
  ),
  commandError: define(
    "Command Error Event",
    'The "command:error" event reports failures from fire-and-forget commands on iOS. Android currently logs fire failures without emitting this event.',
    `const unsubscribe = window.urb.on("command:error", (event) => {
  console.error(event.command, event.code, event.message);
});

// Later:
unsubscribe();`,
    [
      "Observing failures from fire commands that cannot reject a Promise.",
      "Subscribe once near application startup and clean up the listener.",
      "Current native emission is iOS-only.",
    ],
    [
      ["command", "event", "Command that failed."],
      ["code", "event", "Stable machine-readable error code."],
      ["message", "event", "Human-readable diagnostic."],
      ["on()", "API", "Returns an unsubscribe callback."],
      ["off()", "API", "Removes a previously registered handler."],
    ],
    `{ "command": "browser:open", "code": "BROWSER_URL_INVALID", "message": "Browser open requires an http or https URL" }`,
    { action: "Start listening" },
  ),
  deepLinkOpen: define(
    "Deep Link Open Event",
    'The Android-only "deepLink:open" event delivers a URL received while the native activity is already running.',
    `const stop = window.urb.on("deepLink:open", ({ url }) => {
  router.push(parseAppUrl(url));
});

onUnmounted(stop);`,
    [
      "Handling warm-start deep links on Android.",
      "Pair with deepLink:getInitial for cold starts.",
      "Validate and route URLs; never execute arbitrary URL content.",
    ],
    [
      ["url", "event", "Deep link received by the Android activity."],
      [
        "platform",
        "availability",
        "Android only in the current native implementations.",
      ],
      ["on()", "API", "Registers a typed handler and returns cleanup."],
      ["off()", "API", "Removes the exact handler reference."],
    ],
    `{ "url": "myapp://orders/123" }`,
    { action: "Start listening" },
  ),
  networkStatusChange: define(
    "Network Status Change Event",
    'The "network:statusChange" event streams native connectivity changes on Android and iOS.',
    `const stop = window.urb.on("network:statusChange", (status) => {
  online.value = status.connected;
});

onUnmounted(stop);`,
    [
      "Keeping offline indicators in sync after the initial status query.",
      "Subscribe once and remove the listener when its owner unmounts.",
      "Treat status as a hint; requests can still fail.",
    ],
    [
      ["connected", "event", "Whether a native network path exists."],
      ["type", "event", "wifi, cellular, ethernet, vpn, none, or unknown."],
      ["expensive", "event", "Whether the path may be metered."],
      ["on() / off()", "API", "Register and remove the typed event handler."],
    ],
    `{ "connected": true, "type": "wifi", "expensive": false }`,
    { action: "Start listening" },
  ),
  urbBridge: define(
    "URB Bridge",
    "The URB bridge exposes typed request-response commands, fire-and-forget commands, events, native WebSockets, clipboard helpers, availability detection, and UrbError failures.",
    `if (!window.urb.isAvailable()) {
  // Browser preview: show a native-only fallback.
  return;
}

try {
  const device = await window.urb.send({ name: "device:info" });
} catch (error) {
  if (error instanceof UrbError) {
    console.error(error.code, error.message);
  }
}`,
    [
      "Guarding shared web/native screens with isAvailable().",
      "Use send for a typed Promise, fire for one-way actions, and on/off for native events.",
      "Always branch on UrbError.code rather than parsing its message.",
    ],
    [
      [
        "isAvailable()",
        "API",
        "True only when the native message bridge is installed.",
      ],
      [
        "send(request)",
        "API",
        "Posts a request and resolves or rejects its typed Promise.",
      ],
      [
        "fire(request)",
        "API",
        "Posts a one-way command with no returned result.",
      ],
      ["on / off", "API", "Manage typed native-event listeners."],
      ["clipboard", "API", "Convenience getText and setText helpers."],
      ["websocket.open", "API", "Creates a high-level native socket handle."],
      ["UrbError.code", "error", "Stable code for application control flow."],
      unavailableError,
    ],
    `{
  "available": false,
  "behavior": {
    "send": "rejects with URB_UNAVAILABLE",
    "fire": "logs supported fallbacks",
    "events": "no native events"
  }
}`,
    { action: "Inspect bridge" },
  ),
} as const satisfies Record<string, UrbStoryDefinition>;

export type UrbStoryId = keyof typeof urbStoryCatalog;
