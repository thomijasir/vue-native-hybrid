<script lang="ts">
import type { StoriesLayoutProps } from "~/layouts/Stories/Stories.interface";
import { uiApi } from "./UiStoryApi";

export const story: StoriesLayoutProps = {
  name: "Dialog",
  category: "ui",
  description:
    "An accessible centered modal surface with a shared backdrop, focus management, scroll locking, and dependency-free CSS transitions.",
  usageCode: `import { Dialog } from "~/components/ui";

<Dialog
  v-model="isOpen"
  ariaLabel="Confirm deletion"
  max-width="32rem"
>
  <h2>Delete this item?</h2>
  <button @click="isOpen = false">Cancel</button>
</Dialog>`,
  whenToUse: [
    "For decisions or focused tasks that must interrupt the current workflow.",
    "Provide a concise aria-label that describes the dialog purpose.",
    "Use closeOnBackdrop or closeOnEscape false when dismissal would lose important work.",
  ],
  api: uiApi([
    ["v-model", "boolean", "false", "Controls whether the dialog is open."],
    [
      "ariaLabel",
      "string",
      "required",
      "Accessible name announced for the modal dialog.",
    ],
    [
      "closeOnBackdrop",
      "boolean",
      "true",
      "Dismisses the dialog when the backdrop is clicked.",
    ],
    [
      "closeOnEscape",
      "boolean",
      "true",
      "Dismisses the dialog when Escape is pressed.",
    ],
    [
      "backdropOpacity",
      "number",
      "0.5",
      "Opacity passed to the shared Backdrop component.",
    ],
    ["maxWidth", "string", '"32rem"', "Maximum width of the dialog surface."],
    ["class", "string", "—", "Classes merged onto the dialog surface."],
    ["default slot", "Slot", "—", "Dialog content and actions."],
  ]),
};
</script>

<script setup lang="ts">
import { ref } from "vue";
import { Button, Dialog } from "~/components/ui";
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
          Open the dialog, then close it with an action, the dark backdrop, or
          the Escape key.
        </div>
        <Button data-testid="open-dialog" @click="isOpen = true">
          Open dialog
        </Button>

        <Dialog v-model="isOpen" aria-label="Confirm profile update">
          <div class="space-y-4">
            <div>
              <h2 class="text-xl font-semibold">Update profile?</h2>
              <p class="mt-2 text-sm text-foreground-muted">
                Keyboard focus stays inside this dialog until it closes.
              </p>
            </div>
            <div class="flex justify-end gap-2">
              <Button
                data-testid="close-dialog"
                variant="outlined"
                @click="isOpen = false">
                Cancel
              </Button>
              <Button @click="isOpen = false">Save changes</Button>
            </div>
          </div>
        </Dialog>
      </div>
    </template>
  </StoriesLayout>
</template>
