<script lang="ts">
import type { StoriesLayoutProps } from "~/layouts/Stories/Stories.interface";
import { uiApi } from "./UiStoryApi";

export const story: StoriesLayoutProps = {
  name: "Checkbox",
  category: "ui",
  description:
    "A form checkbox with v-model binding, three sizes, disabled and error states, generated label association, and a custom label slot.",
  usageCode: `import { Checkbox } from "~/components/ui";

<Checkbox
  v-model="agreed"
  label="I agree to the terms"
  error="You must accept the terms"
/>`,
  whenToUse: [
    "Independent yes/no choices where more than one option may be selected.",
    "Consent, preference, and multi-select form controls.",
    "Use Radio when the user must choose exactly one mutually exclusive option.",
  ],
  api: uiApi([
    ["v-model", "boolean", "false", "Two-way checked state."],
    ["label", "string", "—", "Text associated with the native checkbox."],
    [
      "error",
      "boolean | string",
      "—",
      "Applies error styling; a string is exposed as an accessible description.",
    ],
    [
      "disabled",
      "boolean",
      "false",
      "Disables interaction and dims the control.",
    ],
    [
      "size",
      '"small" | "medium" | "large"',
      '"medium"',
      "Controls the checkbox and checkmark dimensions.",
    ],
    [
      "id",
      "string",
      "generated",
      "Overrides the generated input and label identifier.",
    ],
    ["class", "string", "—", "Classes merged onto the native input."],
    [
      "containerClass",
      "string",
      "—",
      "Classes merged onto the outer container.",
    ],
    [
      "#label",
      "slot",
      "label prop",
      "Replaces the label text with custom content.",
    ],
  ]),
};
</script>

<script setup lang="ts">
import { ref } from "vue";
import { Checkbox, type CheckboxSize, Text } from "~/components/ui";
import { StoriesLayout } from "~/layouts";

const meta = story;
const accepted = ref(false);
const newsletter = ref(true);
const sizes: CheckboxSize[] = ["small", "medium", "large"];
</script>

<template>
  <StoriesLayout v-bind="meta">
    <template #demo>
      <div class="space-y-6">
        <section>
          <p
            class="mb-3 text-xs font-semibold text-foreground-subtle uppercase">
            Interactive v-model
          </p>
          <Checkbox v-model="accepted" label="Accept the terms" />
          <p class="mt-2 font-mono text-xs text-foreground-muted">
            accepted: {{ accepted }}
          </p>
        </section>

        <section>
          <p
            class="mb-3 text-xs font-semibold text-foreground-subtle uppercase">
            Sizes
          </p>
          <div class="flex flex-wrap items-center gap-5">
            <Checkbox
              v-for="size in sizes"
              :key="size"
              :size="size"
              :model-value="true"
              :label="size" />
          </div>
        </section>

        <section>
          <p
            class="mb-3 text-xs font-semibold text-foreground-subtle uppercase">
            States
          </p>
          <div class="space-y-3">
            <Checkbox v-model="newsletter" label="Checked" />
            <Checkbox label="Unchecked" />
            <Checkbox :model-value="true" disabled label="Disabled checked" />
            <Checkbox error="Selection required" label="Error state" />
          </div>
        </section>

        <section>
          <p
            class="mb-3 text-xs font-semibold text-foreground-subtle uppercase">
            Label slot
          </p>
          <Checkbox>
            <template #label>
              <Text variant="body2">
                Receive <strong class="text-primary">priority</strong> updates
              </Text>
            </template>
          </Checkbox>
        </section>
      </div>
    </template>
  </StoriesLayout>
</template>
