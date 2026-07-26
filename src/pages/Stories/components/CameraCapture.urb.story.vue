<script lang="ts">
import type { StoriesLayoutProps } from "~/layouts/Stories/Stories.interface";

export const story: StoriesLayoutProps = {
  name: "Camera Capture",
  category: "urb",
  description:
    'The "camera:capture" URB command opens the native camera and returns a single JPEG photo as a browser File object. Optional compression controls quality and dimensions. Mobile-only — on the web the native bridge is unavailable.',
  usageCode: `const result = await window.urb.send({
  name: "camera:capture",
  payload: {
    compression: { quality: 80, maxWidth: 1920, maxHeight: 1920 },
  },
});

// result.file is a ready-to-use browser File (image/jpeg)
const previewUrl = URL.createObjectURL(result.file);

const formData = new FormData();
formData.append("photo", result.file);

// Revoke the URL when the preview is replaced or unmounted.
URL.revokeObjectURL(previewUrl);`,
  whenToUse: [
    "Capturing a single photo — profile picture, avatar, or document scan.",
    "When you need a real File object to upload or preview.",
    "Mobile only — guard shared screens with window.urb.isAvailable().",
    "One capture at a time; a second call while busy rejects with CAMERA_BUSY.",
  ],
  api: {
    columns: [
      { key: "name", label: "Name" },
      { key: "kind", label: "Kind" },
      { key: "description", label: "Description" },
    ],
    rows: [
      {
        name: "compression.quality",
        kind: "param",
        description:
          "JPEG quality, 0–100 (or 0–1 on iOS). An options object defaults to 82%.",
      },
      {
        name: "compression.maxWidth",
        kind: "param",
        description:
          "Maximum width in pixels; the image is downscaled if exceeded.",
      },
      {
        name: "compression.maxHeight",
        kind: "param",
        description:
          "Maximum height in pixels; the image is downscaled if exceeded.",
      },
      {
        name: "compression: false",
        kind: "param",
        description:
          "Android preserves the captured file; iOS still emits JPEG at 92% without resizing.",
      },
      {
        name: "compression omitted",
        kind: "platform default",
        description:
          "Android uses 82% and 1920 px bounds; iOS uses 92% without resizing.",
      },
      {
        name: "file",
        kind: "result",
        description: "Captured image as a browser File object (image/jpeg).",
      },
      {
        name: "fileName",
        kind: "result",
        description: 'Generated name, e.g. "urb-camera-<timestamp>.jpg".',
      },
      {
        name: "mimeType",
        kind: "result",
        description: 'Always "image/jpeg".',
      },
      {
        name: "size",
        kind: "result",
        description: "File size in bytes.",
      },
      {
        name: "createdAt",
        kind: "result",
        description: "ISO 8601 capture timestamp.",
      },
      {
        name: "CAMERA_BUSY",
        kind: "error",
        description: "A capture is already in progress.",
      },
      {
        name: "CAMERA_PERMISSION_DENIED",
        kind: "error",
        description: "Camera permission was not granted.",
      },
      {
        name: "CAMERA_CANCELLED",
        kind: "error",
        description: "The user cancelled the capture.",
      },
      {
        name: "CAMERA_UNAVAILABLE",
        kind: "error",
        description: "No camera hardware (physical device only).",
      },
      {
        name: "CAMERA_UNREADABLE_IMAGE",
        kind: "error",
        description: "Image unreadable or larger than 20 MB.",
      },
      {
        name: "CAMERA_FAILED / CAMERA_OPEN_FAILED",
        kind: "platform error",
        description:
          "Android/iOS could not launch or process the native camera.",
      },
    ],
  },
};
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { StoriesLayout } from "~/layouts";
import { Button } from "~/components/ui";
import type { CameraCaptureResult } from "~/lib/Urb/Urb.interface";
import { UrbError } from "~/lib/Urb/Urb.interface";
import UrbStoryPreview from "./UrbStoryPreview.vue";

const meta = story;

const available = computed(() => window.urb?.isAvailable() ?? false);

const status = ref<"idle" | "capturing" | "success" | "error">("idle");
const result = ref<CameraCaptureResult | null>(null);
const previewUrl = ref("");
const errorCode = ref<string>("");

const sampleResult = `{
  "file": File,
  "fileName": "urb-camera-1715000000.jpg",
  "mimeType": "image/jpeg",
  "size": 184320,
  "createdAt": "2026-07-26T10:00:00.000Z"
}`;

function clearPreview() {
  if (!previewUrl.value) return;
  URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = "";
}

async function capture() {
  if (status.value === "capturing") return;
  status.value = "capturing";
  clearPreview();
  result.value = null;
  errorCode.value = "";

  try {
    const captured = await window.urb.send({
      name: "camera:capture",
      payload: {
        compression: { quality: 80, maxWidth: 1920, maxHeight: 1920 },
      },
    });
    result.value = captured;
    previewUrl.value = URL.createObjectURL(captured.file);
    status.value = "success";
  } catch (error) {
    errorCode.value =
      error instanceof UrbError ? error.code : "URB_UNKNOWN_ERROR";
    status.value = "error";
  }
}

onBeforeUnmount(clearPreview);
</script>

<template>
  <StoriesLayout v-bind="meta">
    <template #demo>
      <UrbStoryPreview v-if="!available" :sample="sampleResult" unavailable />

      <!-- Device: live capture. -->
      <div v-else class="space-y-4">
        <Button
          :loading="status === 'capturing'"
          :disabled="status === 'capturing'"
          @click="capture">
          {{ status === "capturing" ? "Opening camera…" : "Capture photo" }}
        </Button>

        <div
          v-if="status === 'success' && result"
          class="rounded-sm border border-success-50 bg-success-50/40 p-3 text-sm">
          <p class="font-semibold text-success">Captured</p>

          <figure v-if="previewUrl" class="mt-3">
            <img
              :src="previewUrl"
              :alt="`Captured photo: ${result.fileName}`"
              class="max-h-[28rem] w-full rounded-sm bg-surface object-contain" />
            <figcaption class="mt-2 text-xs text-foreground-muted">
              Captured image preview
            </figcaption>
          </figure>

          <dl class="mt-2 space-y-1 text-foreground-muted">
            <div class="flex justify-between gap-4">
              <dt>fileName</dt>
              <dd class="font-mono text-foreground">{{ result.fileName }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt>size</dt>
              <dd class="font-mono text-foreground">{{ result.size }} bytes</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt>mimeType</dt>
              <dd class="font-mono text-foreground">{{ result.mimeType }}</dd>
            </div>
          </dl>
        </div>

        <div
          v-if="status === 'error'"
          class="rounded-sm border border-error-50 bg-error-50/40 p-3 text-sm">
          <p class="font-semibold text-error">Capture failed</p>
          <p class="mt-1 font-mono text-foreground">{{ errorCode }}</p>
        </div>
      </div>
    </template>
  </StoriesLayout>
</template>
