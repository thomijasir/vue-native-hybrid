<script lang="ts">
import type { StoriesLayoutProps } from "~/layouts/Stories/Stories.interface";
import { uiApi } from "./UiStoryApi";

export const story: StoriesLayoutProps = {
  name: "Backdrop",
  category: "ui",
  description:
    "A fixed, animated overlay for dialogs, drawers, and other modal surfaces. It blocks pointer interaction with the page and emits click when the user presses outside the foreground content.",
  usageCode: `import { Backdrop } from "~/components/ui";

<Backdrop
  :is-open="isOpen"
  :opacity="0.5"
  @click="isOpen = false"
/>`,
  whenToUse: [
    "Behind a modal, drawer, action sheet, or other blocking foreground surface.",
    "When clicking outside the foreground content should dismiss it.",
    "Keep focus management and Escape-key handling in the foreground component.",
  ],
  api: uiApi([
    [
      "isOpen",
      "boolean",
      "required",
      "Controls visibility through v-show and the backdrop transition.",
    ],
    [
      "opacity",
      "number",
      "0.5",
      "Target overlay opacity. Use values between 0 and 1.",
    ],
    [
      "@click",
      "(event: MouseEvent) => void",
      "—",
      "Emitted when the backdrop itself is clicked.",
    ],
  ]),
};
</script>

<script setup lang="ts">
import { ref } from "vue";
import { Backdrop, Button } from "~/components/ui";
import { StoriesLayout } from "~/layouts";

const meta = story;
const isOpen = ref(false);
const opacity = ref(0.5);

function openAt(value: number) {
  opacity.value = value;
  isOpen.value = true;
}
</script>

<template>
  <StoriesLayout v-bind="meta">
    <template #demo>
      <div class="space-y-4">
        <div
          class="rounded-sm border border-border bg-surface-muted p-3 text-sm text-foreground-muted">
          Open the real fixed backdrop, then click anywhere on it to return to
          this story.
        </div>
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="value in [0.25, 0.5, 0.75]"
            :key="value"
            variant="outlined"
            @click="openAt(value)">
            Open at {{ value }}
          </Button>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div
            v-for="value in [0.25, 0.5, 0.75]"
            :key="value"
            class="relative h-20 overflow-hidden rounded-sm border border-border bg-surface">
            <div
              class="absolute inset-0 bg-backdrop"
              :style="{ opacity: value }" />
            <span
              class="absolute inset-0 flex items-center justify-center font-mono text-xs text-inverse">
              {{ value }}
            </span>
          </div>
        </div>
        <Backdrop
          :is-open="isOpen"
          :opacity="opacity"
          @click="isOpen = false" />
      </div>
    </template>
  </StoriesLayout>
</template>
