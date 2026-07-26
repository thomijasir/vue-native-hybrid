/// <reference types="vite/client" />

import type { Urb } from "./lib/Urb";

type UrbNativeBridge = {
  postMessage(message: string): void;
};

declare global {
  interface Window {
    urb: Urb;
    urbNative?: UrbNativeBridge;
    __urbReceive?: (response: string) => void;
    __urbEvent?: (event: string) => void;
  }
}
export {};
