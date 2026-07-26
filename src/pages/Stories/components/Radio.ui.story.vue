<script lang="ts">
import type { StoriesLayoutProps } from "~/layouts/Stories/Stories.interface";
import { uiApi } from "./UiStoryApi";

export const story: StoriesLayoutProps = {
  name: "Radio",
  category: "ui",
  description:
    "A boolean v-model radio control with boxed and plain presentation, left/right input placement, descriptions, and label, description, and icon slots.",
  usageCode: `import { Radio } from "~/components/ui";

<Radio
  v-model="selected"
  name="delivery"
  value="express"
  label="Express delivery"
  description="Arrives the next business day"
/>`,
  whenToUse: [
    "Presenting a selectable option as a boxed card or plain control.",
    "The current component binds a boolean, not a shared selected value; coordinate exclusive groups in the parent.",
    "Use Checkbox for independent options that can be selected together.",
  ],
  api: uiApi([
    [
      "v-model",
      "boolean",
      "false",
      "Two-way checked state for this individual radio.",
    ],
    [
      "label / description",
      "string",
      "—",
      "Primary and supporting option text.",
    ],
    [
      "error / disabled",
      "boolean",
      "false",
      "Error presentation or disabled interaction.",
    ],
    [
      "name / value",
      "string",
      "—",
      "Native radio grouping and form submission attributes.",
    ],
    [
      "inputPosition",
      '"left" | "right"',
      '"right"',
      "Places the native control before or after content.",
    ],
    [
      "variant",
      '"boxed" | "plain"',
      '"boxed"',
      "Card-like or minimal presentation.",
    ],
    [
      "id",
      "string",
      "generated",
      "Declared in RadioProps, but the current implementation always generates its own ID.",
    ],
    [
      "class / containerClass",
      "string",
      "—",
      "Classes merged onto the input or root.",
    ],
    [
      "#label / #description / #icon",
      "slots",
      "prop content",
      "Custom option content.",
    ],
  ]),
};
</script>

<script setup lang="ts">
import { ref } from "vue";
import { Radio } from "~/components/ui";
import { StoriesLayout } from "~/layouts";

const meta = story;
const boxed = ref(true);
const plain = ref(false);
</script>

<template>
  <StoriesLayout v-bind="meta">
    <template #demo>
      <div class="space-y-6">
        <section>
          <p
            class="mb-3 text-xs font-semibold text-foreground-subtle uppercase">
            Interactive boxed
          </p>
          <Radio
            v-model="boxed"
            label="Express delivery"
            description="Arrives the next business day"
            name="delivery-demo"
            value="express">
            <template #icon>
              <span
                class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary"
                aria-hidden="true">
                ⚡
              </span>
            </template>
          </Radio>
          <p class="mt-2 font-mono text-xs text-foreground-muted">
            checked: {{ boxed }}
          </p>
        </section>

        <section>
          <p
            class="mb-3 text-xs font-semibold text-foreground-subtle uppercase">
            Plain and input positions
          </p>
          <div class="space-y-4">
            <Radio
              v-model="plain"
              variant="plain"
              input-position="left"
              label="Input on the left" />
            <Radio
              variant="plain"
              input-position="right"
              label="Input on the right" />
          </div>
        </section>

        <section>
          <p
            class="mb-3 text-xs font-semibold text-foreground-subtle uppercase">
            States
          </p>
          <div class="grid gap-3 sm:grid-cols-2">
            <Radio :model-value="true" label="Selected" />
            <Radio label="Unselected" />
            <Radio :model-value="true" disabled label="Disabled" />
            <Radio error label="Error state" description="Review this choice" />
          </div>
        </section>
      </div>
    </template>
  </StoriesLayout>
</template>
