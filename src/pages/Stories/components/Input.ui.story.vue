<script lang="ts">
import type { StoriesLayoutProps } from "~/layouts/Stories/Stories.interface";
import { uiApi } from "./UiStoryApi";

export const story: StoriesLayoutProps = {
  name: "Input",
  category: "ui",
  description:
    "A labeled text input with v-model binding, helper and error messages, start/end slots, text-case transforms, three sizes, and typed focus/change events.",
  usageCode: `import { Input } from "~/components/ui";

<Input
  v-model="email"
  type="email"
  label="Email"
  placeholder="name@example.com"
  helper-text="We will only use this for account updates."
  @change="validateEmail"
/>`,
  whenToUse: [
    "Collecting short, single-line form values.",
    "When a field needs an associated label, helper text, validation, or prefix/suffix.",
    "Use textCase only when the stored model value should also be transformed.",
  ],
  api: uiApi([
    [
      "v-model",
      "string",
      '""',
      "Two-way value; transformations are applied before emission.",
    ],
    ["label", "string", "—", "Label associated with the native input."],
    [
      "error",
      "string | boolean",
      "—",
      "Error styling and optional visible/accessible message.",
    ],
    [
      "helperText",
      "string",
      "—",
      "Supporting text displayed when there is no string error.",
    ],
    [
      "fullWidth",
      "boolean",
      "true",
      "Makes the outer container span its parent.",
    ],
    [
      "size",
      '"small" | "medium" | "large"',
      '"medium"',
      "Controls input padding and text size.",
    ],
    [
      "textCase",
      '"normal" | "uppercase" | "lowercase"',
      '"normal"',
      "Transforms both display and model value.",
    ],
    ["disabled", "boolean", "false", "Disables the native input."],
    [
      "placeholder / type / id",
      "string",
      "type: text",
      "Forwarded input attributes and label identifier.",
    ],
    [
      "class / containerClass",
      "string",
      "—",
      "Classes merged onto the input or outer container.",
    ],
    [
      "#start / #end",
      "slots",
      "—",
      "Prefix and suffix content inside the input surface.",
    ],
    [
      "@change",
      "(value: string) => void",
      "—",
      "Emitted when the native change event commits.",
    ],
    [
      "@blur / @focus / @click",
      "DOM events",
      "—",
      "Forwarded interaction events.",
    ],
    [
      "template ref",
      "{ input: HTMLInputElement }",
      "—",
      "Exposes the underlying input element.",
    ],
  ]),
};
</script>

<script setup lang="ts">
import { ref } from "vue";
import { Input, type InputSize } from "~/components/ui";
import { StoriesLayout } from "~/layouts";

const meta = story;
const email = ref("");
const upper = ref("");
const eventMessage = ref("No committed change yet");
const sizes: InputSize[] = ["small", "medium", "large"];
</script>

<template>
  <StoriesLayout v-bind="meta">
    <template #demo>
      <div class="space-y-6">
        <section class="space-y-2">
          <p class="text-xs font-semibold text-foreground-subtle uppercase">
            Interactive value and events
          </p>
          <Input
            v-model="email"
            type="email"
            label="Email"
            placeholder="name@example.com"
            helper-text="Blur the field to emit change."
            @change="eventMessage = `change: ${$event || '(empty)'}`"
            @focus="eventMessage = 'focus'"
            @blur="eventMessage = 'blur'">
            <template #start><span aria-hidden="true">@</span></template>
            <template #end><span class="text-xs">work</span></template>
          </Input>
          <p class="font-mono text-xs text-foreground-muted">
            value: {{ email || '""' }} · {{ eventMessage }}
          </p>
        </section>

        <section class="space-y-3">
          <p class="text-xs font-semibold text-foreground-subtle uppercase">
            Sizes
          </p>
          <Input
            v-for="size in sizes"
            :key="size"
            :size="size"
            :label="size"
            :placeholder="`${size} input`" />
        </section>

        <section class="grid gap-3 sm:grid-cols-2">
          <Input label="Helper" helper-text="Supporting information" />
          <Input label="Invalid" error="This field is required" />
          <Input label="Disabled" disabled model-value="Unavailable" />
          <Input
            v-model="upper"
            label="Uppercase model"
            text-case="uppercase"
            placeholder="Type lowercase" />
        </section>
      </div>
    </template>
  </StoriesLayout>
</template>
