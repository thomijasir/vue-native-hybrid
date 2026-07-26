<script lang="ts">
import type { StoriesLayoutProps } from "~/layouts/Stories/Stories.interface";
import { uiApi } from "./UiStoryApi";

export const story: StoriesLayoutProps = {
  name: "Drawer",
  category: "ui",
  description:
    "An accessible bottom sheet with a shared backdrop, safe-area spacing, focus management, and a dependency-free slide transition.",
  usageCode: `import { Drawer } from "~/components/ui";

<Drawer
  v-model="isOpen"
  ariaLabel="Choose delivery options"
  max-height="70svh"
>
  <h2>Delivery options</h2>
  <button @click="isOpen = false">Done</button>
</Drawer>`,
  whenToUse: [
    "For mobile-friendly choices or supporting content anchored to the bottom edge.",
    "Use Dialog instead when the task is better presented as a centered decision.",
    "This component is a bottom sheet only and does not provide drag gestures.",
  ],
  api: uiApi([
    ["v-model", "boolean", "false", "Controls whether the drawer is open."],
    [
      "ariaLabel",
      "string",
      "required",
      "Accessible name announced for the modal drawer.",
    ],
    [
      "closeOnBackdrop",
      "boolean",
      "true",
      "Dismisses the drawer when the backdrop is clicked.",
    ],
    [
      "closeOnEscape",
      "boolean",
      "true",
      "Dismisses the drawer when Escape is pressed.",
    ],
    [
      "backdropOpacity",
      "number",
      "0.5",
      "Opacity passed to the shared Backdrop component.",
    ],
    ["maxHeight", "string", '"90svh"', "Maximum height of the bottom sheet."],
    ["class", "string", "—", "Classes merged onto the drawer surface."],
    ["default slot", "Slot", "—", "Drawer content and actions."],
  ]),
};
</script>

<script setup lang="ts">
import { ref } from "vue";
import { Button, Drawer } from "~/components/ui";
import { StoriesLayout } from "~/layouts";

const meta = story;
const isOpen = ref(false);
</script>

<template>
  <StoriesLayout v-bind="meta">
    <template #demo>
      <div class="space-y-4">
        <div
          class="rounded-sm border border-border bg-surface-muted p-3 text-sm text-foreground-muted">
          Open the bottom sheet, then dismiss it with Done, the dark backdrop,
          or the Escape key.
        </div>
        <Button data-testid="open-drawer" @click="isOpen = true">
          Open drawer
        </Button>

        <Drawer
          v-model="isOpen"
          aria-label="Choose delivery speed"
          max-height="70svh">
          <div class="space-y-4">
            <div>
              <h2 class="text-xl font-semibold">Delivery speed</h2>
              <p class="mt-2 text-sm text-foreground-muted">
                The sheet respects the device bottom safe area.
              </p>
            </div>
            <label
              class="flex items-center justify-between rounded-md border border-border p-3">
              <span>Standard delivery</span>
              <input type="radio" name="delivery" checked />
            </label>
            <label
              class="flex items-center justify-between rounded-md border border-border p-3">
              <span>Express delivery</span>
              <input type="radio" name="delivery" />
            </label>
            <Button data-testid="close-drawer" block @click="isOpen = false">
              Done
            </Button>
          </div>
        </Drawer>
      </div>
    </template>
  </StoriesLayout>
</template>
