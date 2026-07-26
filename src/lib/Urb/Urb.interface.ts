export type CameraCaptureResult = {
  file: File;
  fileName: string;
  mimeType: "image/jpeg";
  size: number;
  createdAt: string;
};

export type UrbImageCompressionOptions =
  | boolean
  | {
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
    };

export type CameraCapturePayload = {
  compression?: UrbImageCompressionOptions;
};

export type UrbPickedFile = {
  file: File;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export type UrbPickFilesResult = {
  files: File[];
  items: UrbPickedFile[];
};

export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | { [key: string]: JsonValue }
  | JsonValue[];

export type UrbFetchHeaders = Record<string, string> | [string, string][];

export type UrbFetchBody =
  | string
  | Blob
  | ArrayBuffer
  | ArrayBufferView
  | FormData;

export type UrbFetchPayload = {
  url: string;
  method?: string;
  headers?: UrbFetchHeaders;
  bodyJson?: JsonValue;
  body?: UrbFetchBody;
};

export type UrbFetchResult = Response;

export type UrbWebSocketHeaders = Record<string, string> | [string, string][];

export type UrbWebSocketOpenPayload = {
  url: string;
  headers?: UrbWebSocketHeaders;
  protocols?: string[];
};

export type UrbWebSocketSendBody =
  | string
  | Blob
  | ArrayBuffer
  | ArrayBufferView;

export type UrbWebSocketReadyState = 0 | 1 | 2 | 3;

export type UrbWebSocketOpenEvent = {
  socketId: string;
  protocol: string;
};

export type UrbWebSocketMessageEvent = {
  socketId: string;
  data: string | ArrayBuffer;
  binary: boolean;
};

export type UrbWebSocketCloseEvent = {
  socketId: string;
  code: number;
  reason: string;
};

export type UrbWebSocketErrorEvent = {
  socketId: string;
  message: string;
};

export type UrbWebSocket = {
  readonly id: string;
  readonly url: string;
  readonly protocol: string;
  readonly readyState: UrbWebSocketReadyState;
  onopen?: (event: UrbWebSocketOpenEvent) => void;
  onmessage?: (event: UrbWebSocketMessageEvent) => void;
  onerror?: (event: UrbWebSocketErrorEvent) => void;
  onclose?: (event: UrbWebSocketCloseEvent) => void;
  send(body: UrbWebSocketSendBody): Promise<void>;
  close(code?: number, reason?: string): Promise<void>;
};

export type UrbWebSocketOpenResult = {
  socketId: string;
};

export type UrbWebSocketSendPayload = {
  socketId: string;
  body: UrbWebSocketNativeSendBody;
};

export type UrbWebSocketNativeSendBody =
  | { kind: "text"; value: string }
  | { kind: "base64"; value: string };

export type UrbWebSocketClosePayload = {
  socketId: string;
  code?: number;
  reason?: string;
};

export type MediaPickPayload = {
  multiple?: boolean;
  type?: "image" | "video" | "imageAndVideo";
  maxItems?: number;
  compression?: UrbImageCompressionOptions;
};

export type DocumentsPickPayload = {
  multiple?: boolean;
  mimeTypes?: string[];
  maxItems?: number;
};

export type UrbLocationAccuracy = "fine" | "coarse";

export type UrbCoordinates = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
};

export type UrbLocationProvider = "gps" | "network" | "passive" | "unknown";

export type UrbLocationResult = UrbCoordinates & {
  provider: UrbLocationProvider;
  capturedAt: string;
};

export type UrbPickLocationResult = UrbCoordinates & {
  pickedAt: string;
};

export type LocationGetCurrentPayload = {
  accuracy?: UrbLocationAccuracy;
  timeoutMs?: number;
};

export type LocationPickPayload = {
  initialLocation?: UrbCoordinates;
  accuracy?: UrbLocationAccuracy;
  timeoutMs?: number;
};

export type UrbIntentTarget = "appSettings" | "mapLocationPicker";
export type UrbIOSIntentTarget = "shareSheet";

export type UrbIntentExtraValue = string | number | boolean | null;

export type UrbIntentOpenPayload = {
  target: UrbIntentTarget | UrbIOSIntentTarget;
  extras?: Record<string, UrbIntentExtraValue>;
};

export type UrbIntentResult = {
  resultCode: "ok" | "cancelled";
  extras: Record<string, UrbIntentExtraValue>;
};

export type UrbBrowserMode = "external" | "inApp";

export type UrbBrowserOpenPayload = {
  url: string;
  mode?: UrbBrowserMode;
};

export type UrbPermissionName =
  | "camera"
  | "microphone"
  | "contacts"
  | "phone"
  | "location:coarse"
  | "location:fine"
  | "notifications"
  | "photos"
  | "nearby:bluetooth"
  | "nearby:wifi";

export type UrbPermissionStatus =
  | "granted"
  | "denied"
  | "prompt"
  | "restricted"
  | "limited"
  | "notRequired"
  | "notDeclared";

export type PermissionState = {
  name: UrbPermissionName;
  status: UrbPermissionStatus;
  granted: boolean;
  shouldShowRationale: boolean;
  androidPermissions: string[];
};

export type PermissionsGetPayload = {
  names?: UrbPermissionName[];
};

export type PermissionsRequestPayload = {
  names: UrbPermissionName[];
};

export type ClipboardGetTextResult = {
  text: string;
};

export type ClipboardSetTextPayload = {
  text: string;
  label?: string;
};

export type ClipboardSetTextOptions = {
  label?: string;
};

export type UrbDeviceInfo = {
  platform: "android" | "ios";
  osName: "Android" | "iOS";
  osVersion: string;
  sdkInt?: number;
  manufacturer?: string;
  model: string;
  brand?: string;
  device?: string;
  appId: string;
  appVersionName: string;
  appVersionCode: number;
  buildType: "debug" | "release";
  locale: string;
  timeZone: string;
  deviceName?: string;
};

export type UrbNetworkStatus = {
  connected: boolean;
  type: "wifi" | "cellular" | "ethernet" | "vpn" | "none" | "unknown";
  expensive: boolean;
};

export type UrbEventMap = {
  "command:error": {
    command: string;
    code: string;
    message: string;
  };
  "deepLink:open": {
    url: string;
  };
  "network:statusChange": UrbNetworkStatus;
};

export type UrbSendCommands = {
  "camera:capture": {
    payload: CameraCapturePayload | undefined;
    result: CameraCaptureResult;
  };
  "media:pick": {
    payload: MediaPickPayload | undefined;
    result: UrbPickFilesResult;
  };
  "document:pick": {
    payload: DocumentsPickPayload | undefined;
    result: UrbPickFilesResult;
  };
  "location:current": {
    payload: LocationGetCurrentPayload | undefined;
    result: UrbLocationResult;
  };
  "location:pick": {
    payload: LocationPickPayload | undefined;
    result: UrbPickLocationResult;
  };
  "intent:openForResult": {
    payload: UrbIntentOpenPayload;
    result: UrbIntentResult;
  };
  "permissions:get": {
    payload: PermissionsGetPayload | undefined;
    result: PermissionState[];
  };
  "permissions:request": {
    payload: PermissionsRequestPayload;
    result: PermissionState[];
  };
  "clipboard:getText": {
    payload: undefined;
    result: ClipboardGetTextResult;
  };
  "clipboard:setText": {
    payload: ClipboardSetTextPayload;
    result: undefined;
  };
  "device:info": {
    payload: undefined;
    result: UrbDeviceInfo;
  };
  "secureStorage:set": {
    payload: { key: string; value: string };
    result: undefined;
  };
  "secureStorage:get": {
    payload: { key: string };
    result: { value: string | null };
  };
  "secureStorage:delete": {
    payload: { key: string };
    result: undefined;
  };
  "secureStorage:clear": {
    payload: undefined;
    result: undefined;
  };
  "biometrics:getAvailability": {
    payload: undefined;
    result: {
      available: boolean;
      enrolled: boolean;
      supported: boolean;
      reason?: string;
    };
  };
  "biometrics:authenticate": {
    payload: { reason?: string } | undefined;
    result: { authenticated: true };
  };
  "deepLink:getInitial": {
    payload: undefined;
    result: { url: string | null };
  };
  "network:getStatus": {
    payload: undefined;
    result: UrbNetworkStatus;
  };
  fetch: {
    payload: UrbFetchPayload;
    result: UrbFetchResult;
  };
  "websocket:open": {
    payload: UrbWebSocketOpenPayload;
    result: UrbWebSocketOpenResult;
  };
  "websocket:send": {
    payload: UrbWebSocketSendPayload;
    result: undefined;
  };
  "websocket:close": {
    payload: UrbWebSocketClosePayload;
    result: undefined;
  };
};

export type UrbFireCommands = {
  toast: {
    payload: {
      text: string;
    };
  };
  "intent:open": {
    payload: UrbIntentOpenPayload;
  };
  "browser:open": {
    payload: UrbBrowserOpenPayload;
  };
};

type UrbPayload<Name extends keyof UrbSendCommands> =
  UrbSendCommands[Name]["payload"];

export type UrbSendRequest<Name extends keyof UrbSendCommands> =
  undefined extends UrbPayload<Name>
    ? {
        name: Name;
        payload?: Exclude<UrbPayload<Name>, undefined>;
      }
    : {
        name: Name;
        payload: UrbPayload<Name>;
      };

export type UrbFireRequest<Name extends keyof UrbFireCommands> = {
  name: Name;
  payload: UrbFireCommands[Name]["payload"];
};

export type Urb = {
  fire<Name extends keyof UrbFireCommands>(request: UrbFireRequest<Name>): void;
  send<Name extends keyof UrbSendCommands>(
    request: UrbSendRequest<Name>,
  ): Promise<UrbSendCommands[Name]["result"]>;
  on<Name extends keyof UrbEventMap>(
    name: Name,
    handler: (event: UrbEventMap[Name]) => void,
  ): () => void;
  off<Name extends keyof UrbEventMap>(
    name: Name,
    handler: (event: UrbEventMap[Name]) => void,
  ): void;
  websocket: {
    open(payload: UrbWebSocketOpenPayload): Promise<UrbWebSocket>;
  };
  clipboard: {
    getText(): Promise<string>;
    setText(text: string, options?: ClipboardSetTextOptions): Promise<void>;
  };
  isAvailable(): boolean;
};

export type UrbErrorPayload = {
  code: string;
  message: string;
};

export class UrbError extends Error {
  readonly code: string;

  constructor(error: UrbErrorPayload) {
    super(error.message);
    this.name = "UrbError";
    this.code = error.code;
  }
}
