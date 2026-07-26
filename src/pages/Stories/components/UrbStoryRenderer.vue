<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { Button } from "~/components/ui";
import { StoriesLayout } from "~/layouts";
import type { UrbWebSocket } from "~/lib/Urb";
import { UrbError } from "~/lib/Urb";
import UrbStoryPreview from "./UrbStoryPreview.vue";
import { urbStoryCatalog, type UrbStoryId } from "./UrbStoryCatalog";

const props = defineProps<{ storyId: UrbStoryId }>();
const definition = computed(() => urbStoryCatalog[props.storyId]);
const available = computed(() => window.urb?.isAvailable() ?? false);
const status = ref<"idle" | "running" | "success" | "error">("idle");
const output = ref("");
const errorCode = ref("");
const socketUrl = ref("wss://example.test/socket");
const listening = ref(false);

let unsubscribe: (() => void) | undefined;
let socket: UrbWebSocket | undefined;

const json = (value: unknown): string =>
  JSON.stringify(
    value,
    (_key, item) => {
      if (item instanceof File) {
        return {
          type: "File",
          name: item.name,
          mimeType: item.type,
          size: item.size,
        };
      }
      if (item instanceof Response) {
        return {
          type: "Response",
          status: item.status,
          ok: item.ok,
          url: item.url,
        };
      }
      return item;
    },
    2,
  ) ?? "Completed successfully.";

const succeed = (value: unknown) => {
  output.value = value === undefined ? "Completed successfully." : json(value);
  status.value = "success";
};

const fail = (error: unknown) => {
  errorCode.value =
    error instanceof UrbError ? error.code : "URB_UNKNOWN_ERROR";
  status.value = "error";
};

const stopListening = () => {
  unsubscribe?.();
  unsubscribe = undefined;
  listening.value = false;
};

const listen = () => {
  stopListening();
  const id = props.storyId;
  if (id === "commandError") {
    unsubscribe = window.urb.on("command:error", succeed);
  } else if (id === "deepLinkOpen") {
    unsubscribe = window.urb.on("deepLink:open", succeed);
  } else {
    unsubscribe = window.urb.on("network:statusChange", succeed);
  }
  listening.value = true;
  status.value = "idle";
  output.value = "";
};

async function run() {
  if (status.value === "running") return;
  status.value = "running";
  output.value = "";
  errorCode.value = "";

  try {
    switch (props.storyId) {
      case "mediaPick":
        succeed(
          await window.urb.send({
            name: "media:pick",
            payload: { multiple: true, type: "image", maxItems: 5 },
          }),
        );
        break;
      case "documentPick":
        succeed(
          await window.urb.send({
            name: "document:pick",
            payload: {
              multiple: false,
              mimeTypes: ["application/pdf"],
              maxItems: 1,
            },
          }),
        );
        break;
      case "locationCurrent":
        succeed(
          await window.urb.send({
            name: "location:current",
            payload: { accuracy: "fine", timeoutMs: 15000 },
          }),
        );
        break;
      case "locationPick":
        succeed(
          await window.urb.send({
            name: "location:pick",
            payload: {
              initialLocation: { latitude: 1.3521, longitude: 103.8198 },
              accuracy: "fine",
            },
          }),
        );
        break;
      case "intentOpen":
        window.urb.fire({
          name: "intent:open",
          payload: { target: "appSettings" },
        });
        succeed({ dispatched: true, target: "appSettings" });
        break;
      case "intentOpenForResult":
        succeed(
          await window.urb.send({
            name: "intent:openForResult",
            payload: { target: "mapLocationPicker" },
          }),
        );
        break;
      case "browserOpen":
        window.urb.fire({
          name: "browser:open",
          payload: { url: "https://example.com", mode: "inApp" },
        });
        succeed({
          dispatched: true,
          url: "https://example.com",
          mode: "inApp",
        });
        break;
      case "permissionsGet":
        succeed(
          await window.urb.send({
            name: "permissions:get",
            payload: { names: ["camera"] },
          }),
        );
        break;
      case "permissionsRequest":
        succeed(
          await window.urb.send({
            name: "permissions:request",
            payload: { names: ["camera"] },
          }),
        );
        break;
      case "clipboardGetText": {
        const text = await window.urb.clipboard.getText();
        succeed({
          characters: text.length,
          preview: "•".repeat(Math.min(text.length, 8)),
        });
        break;
      }
      case "clipboardSetText":
        await window.urb.clipboard.setText("Hello from URB", {
          label: "URB story demo",
        });
        succeed({ copied: true, characters: 14 });
        break;
      case "deviceInfo":
        succeed(await window.urb.send({ name: "device:info" }));
        break;
      case "secureStorageSet":
        succeed(
          await window.urb.send({
            name: "secureStorage:set",
            payload: { key: "urb.story.demo", value: "Safe demo value" },
          }),
        );
        break;
      case "secureStorageGet": {
        const result = await window.urb.send({
          name: "secureStorage:get",
          payload: { key: "urb.story.demo" },
        });
        succeed({
          value: result.value === null ? null : "•".repeat(result.value.length),
        });
        break;
      }
      case "secureStorageDelete":
        succeed(
          await window.urb.send({
            name: "secureStorage:delete",
            payload: { key: "urb.story.demo" },
          }),
        );
        break;
      case "biometricsGetAvailability":
        succeed(await window.urb.send({ name: "biometrics:getAvailability" }));
        break;
      case "biometricsAuthenticate":
        succeed(
          await window.urb.send({
            name: "biometrics:authenticate",
            payload: { reason: "Confirm this URB story action" },
          }),
        );
        break;
      case "deepLinkGetInitial":
        succeed(await window.urb.send({ name: "deepLink:getInitial" }));
        break;
      case "networkGetStatus":
        succeed(await window.urb.send({ name: "network:getStatus" }));
        break;
      case "fetch": {
        const response = await window.urb.send({
          name: "fetch",
          payload: {
            url: "https://jsonplaceholder.typicode.com/todos/1",
            method: "GET",
          },
        });
        succeed({
          status: response.status,
          ok: response.ok,
          body: await response.json(),
        });
        break;
      }
      case "websocketOpen":
        socket = await window.urb.websocket.open({ url: socketUrl.value });
        succeed({
          id: socket.id,
          url: socket.url,
          protocol: socket.protocol,
          readyState: socket.readyState,
        });
        break;
      case "websocketSend":
        socket = await window.urb.websocket.open({ url: socketUrl.value });
        await socket.send("Hello from URB");
        succeed({ sent: true, body: "Hello from URB" });
        break;
      case "websocketClose":
        socket = await window.urb.websocket.open({ url: socketUrl.value });
        await socket.close(1000, "Finished");
        succeed({ closed: true, code: 1000, reason: "Finished" });
        socket = undefined;
        break;
      case "toast":
        window.urb.fire({
          name: "toast",
          payload: { text: "Saved successfully" },
        });
        succeed({ dispatched: true, text: "Saved successfully" });
        break;
      case "commandError":
      case "deepLinkOpen":
      case "networkStatusChange":
        listen();
        break;
      case "urbBridge":
        succeed({
          available: window.urb.isAvailable(),
          APIs: ["send", "fire", "on", "off", "clipboard", "websocket"],
        });
        break;
      case "secureStorageClear":
        break;
    }
  } catch (error) {
    fail(error);
  }
}

onBeforeUnmount(() => {
  stopListening();
  if (socket && socket.readyState !== 3) {
    void socket.close(1000, "Story closed").catch(() => undefined);
  }
});
</script>

<template>
  <StoriesLayout v-bind="definition.meta">
    <template #demo>
      <UrbStoryPreview
        v-if="!definition.live || (!available && storyId !== 'urbBridge')"
        :sample="definition.sample"
        :unavailable="!available && definition.live"
        :note="definition.note" />

      <div v-else class="space-y-4">
        <label
          v-if="storyId.startsWith('websocket')"
          class="block text-sm text-foreground-muted">
          Allowlisted WebSocket URL
          <input
            v-model="socketUrl"
            type="url"
            class="mt-1 w-full rounded-sm border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </label>

        <div class="flex flex-wrap gap-2">
          <Button
            :loading="status === 'running'"
            :disabled="status === 'running'"
            @click="run">
            {{ definition.action }}
          </Button>
          <Button
            v-if="listening"
            variant="outlined"
            color="secondary"
            @click="stopListening">
            Stop listening
          </Button>
        </div>

        <p v-if="listening" class="text-sm text-foreground-muted">
          Listening for native events. Leaving this story also removes the
          listener.
        </p>

        <div
          v-if="status === 'success'"
          class="rounded-sm border border-success-50 bg-success-50/40 p-3 text-sm">
          <p class="font-semibold text-success">Completed</p>
          <pre
            class="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-foreground"><code>{{ output }}</code></pre>
        </div>

        <div
          v-if="status === 'error'"
          class="rounded-sm border border-error-50 bg-error-50/40 p-3 text-sm">
          <p class="font-semibold text-error">URB action failed</p>
          <p class="mt-1 font-mono text-foreground">{{ errorCode }}</p>
        </div>
      </div>
    </template>
  </StoriesLayout>
</template>
