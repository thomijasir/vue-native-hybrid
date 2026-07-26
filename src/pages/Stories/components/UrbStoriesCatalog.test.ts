import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Urb } from "~/lib/Urb";
import { UrbError } from "~/lib/Urb";
import { stories } from "./index";
import CameraCaptureStory from "./CameraCapture.urb.story.vue";
import UrbStoryRenderer from "./UrbStoryRenderer.vue";

const expectedUrbIds = [
  "biometrics-authenticate",
  "biometrics-get-availability",
  "browser-open",
  "camera-capture",
  "clipboard-get-text",
  "clipboard-set-text",
  "command-error",
  "deep-link-get-initial",
  "deep-link-open",
  "device-info",
  "document-pick",
  "fetch",
  "intent-open",
  "intent-open-for-result",
  "location-current",
  "location-pick",
  "media-pick",
  "network-get-status",
  "network-status-change",
  "permissions-get",
  "permissions-request",
  "secure-storage-clear",
  "secure-storage-delete",
  "secure-storage-get",
  "secure-storage-set",
  "toast",
  "urb-bridge",
  "web-socket-close",
  "web-socket-open",
  "web-socket-send",
];

const mountRenderer = (
  storyId: InstanceType<typeof UrbStoryRenderer>["$props"]["storyId"],
) =>
  mount(UrbStoryRenderer, {
    props: { storyId },
    global: {
      stubs: {
        "Stories.layout": {
          template: '<main><slot name="demo" /></main>',
        },
      },
    },
  });

const installUrb = (overrides: Partial<Urb> = {}) => {
  const urb = {
    isAvailable: vi.fn(() => true),
    send: vi.fn(),
    fire: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    clipboard: {
      getText: vi.fn(),
      setText: vi.fn(),
    },
    websocket: {
      open: vi.fn(),
    },
    ...overrides,
  } as unknown as Urb;

  Object.defineProperty(window, "urb", {
    configurable: true,
    value: urb,
  });
  return urb;
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("URB story catalog", () => {
  it("registers the complete public URB surface with valid metadata", () => {
    const urbStories = stories.filter((entry) => entry.category === "urb");

    expect(urbStories.map((entry) => entry.id).sort()).toEqual(expectedUrbIds);
    expect(new Set(urbStories.map((entry) => entry.id)).size).toBe(
      urbStories.length,
    );

    for (const entry of urbStories) {
      expect(entry.meta.category).toBe("urb");
      expect(entry.meta.name.trim()).not.toBe("");
      expect(entry.meta.description.trim()).not.toBe("");
      expect(entry.meta.usageCode.trim()).not.toBe("");
      expect(entry.meta.whenToUse.length).toBeGreaterThan(0);
      expect(entry.meta.api?.rows.length).toBeGreaterThan(0);
    }
  });

  it("does not call native commands when the bridge is unavailable", async () => {
    const send = vi.fn();
    installUrb({
      isAvailable: vi.fn(() => false),
      send: send as Urb["send"],
    });

    const wrapper = mountRenderer("deviceInfo");

    expect(wrapper.text()).toContain("Runs on device only");
    expect(wrapper.find("button").exists()).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it("prevents duplicate command submission while a request is pending", async () => {
    let resolveRequest!: (value: {
      connected: boolean;
      type: "wifi";
      expensive: boolean;
    }) => void;
    const pending = new Promise<{
      connected: boolean;
      type: "wifi";
      expensive: boolean;
    }>((resolve) => {
      resolveRequest = resolve;
    });
    const send = vi.fn(() => pending);
    installUrb({ send: send as Urb["send"] });
    const wrapper = mountRenderer("networkGetStatus");
    const button = wrapper.get("button");

    await button.trigger("click");
    await button.trigger("click");
    expect(send).toHaveBeenCalledTimes(1);

    resolveRequest({ connected: true, type: "wifi", expensive: false });
    await pending;
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Completed");
  });

  it("renders stable UrbError codes", async () => {
    installUrb({
      send: vi.fn(() =>
        Promise.reject(
          new UrbError({ code: "LOCATION_UNAVAILABLE", message: "Timed out" }),
        ),
      ) as Urb["send"],
    });
    const wrapper = mountRenderer("locationCurrent");

    await wrapper.get("button").trigger("click");
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain("LOCATION_UNAVAILABLE");
    });
  });

  it("removes native event listeners when the story unmounts", async () => {
    const unsubscribe = vi.fn();
    const on = vi.fn(() => unsubscribe);
    installUrb({ on: on as Urb["on"] });
    const wrapper = mountRenderer("networkStatusChange");

    await wrapper.get("button").trigger("click");
    expect(on).toHaveBeenCalledWith(
      "network:statusChange",
      expect.any(Function),
    );

    wrapper.unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it("previews a captured camera image and releases its object URL", async () => {
    const file = new File(["jpeg"], "captured.jpg", { type: "image/jpeg" });
    const createObjectURL = vi.fn(() => "blob:camera-preview");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    installUrb({
      send: vi.fn(() =>
        Promise.resolve({
          file,
          fileName: file.name,
          mimeType: "image/jpeg",
          size: file.size,
          createdAt: "2026-07-26T10:00:00.000Z",
        }),
      ) as Urb["send"],
    });

    const wrapper = mount(CameraCaptureStory, {
      global: {
        stubs: {
          "Stories.layout": {
            template: '<main><slot name="demo" /></main>',
          },
        },
      },
    });
    await wrapper.get("button").trigger("click");

    await vi.waitFor(() => {
      expect(wrapper.get("img").attributes("src")).toBe("blob:camera-preview");
    });
    expect(wrapper.get("img").attributes("alt")).toContain("captured.jpg");
    expect(createObjectURL).toHaveBeenCalledWith(file);

    wrapper.unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:camera-preview");
  });
});
