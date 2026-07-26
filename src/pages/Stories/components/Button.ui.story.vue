<script lang="ts">
import type { StoriesLayoutProps } from "~/layouts/Stories/Stories.interface";

export const story: StoriesLayoutProps = {
  name: "Button",
  category: "ui",
  description:
    "A versatile button component with variants, colors, and sizes. Supports loading and disabled states, full-width (block) mode, and icon-only styles. Classes passed via the class prop are merged with twMerge.",
  usageCode: `import { Button } from "~/components/ui";

<Button
  variant="filled"
  color="primary"
  size="medium"
  @click="onSave"
>
  Save
</Button>`,
  whenToUse: [
    "Primary actions in forms, dialogs, and toolbars.",
    "Triggering an async action — use the loading state to give feedback.",
    'Compact icon-only actions (variant "icon" or "iconOutline").',
    "Use block on mobile to span the full viewport width.",
  ],
  api: {
    columns: [
      { key: "prop", label: "Prop" },
      { key: "type", label: "Type" },
      { key: "default", label: "Default" },
      { key: "description", label: "Description" },
    ],
    rows: [
      {
        prop: "variant",
        type: '"outlined" | "filled" | "text" | "icon" | "iconOutline"',
        default: '"filled"',
        description: "Visual style of the button.",
      },
      {
        prop: "color",
        type: '"primary" | "secondary" | "ternary" | "success" | "warning" | "error" | "transparent"',
        default: '"primary"',
        description: "Color theme from the design system.",
      },
      {
        prop: "size",
        type: '"small" | "medium" | "large"',
        default: '"medium"',
        description: "Size of the button.",
      },
      {
        prop: "block",
        type: "boolean",
        default: "—",
        description:
          "When true, the button takes the full width of its container.",
      },
      {
        prop: "disabled",
        type: "boolean",
        default: "—",
        description: "When true, the button is non-interactive.",
      },
      {
        prop: "loading",
        type: "boolean",
        default: "—",
        description: "Shows a spinner and disables interaction.",
      },
      {
        prop: "type",
        type: '"button" | "submit" | "reset"',
        default: '"button"',
        description: "HTML button type attribute.",
      },
      {
        prop: "class",
        type: "string",
        default: "—",
        description: "Extra CSS classes, merged with defaults via twMerge.",
      },
      {
        prop: "@click",
        type: "(event: MouseEvent) => void",
        default: "—",
        description:
          "Emitted on click when the button is not disabled/loading.",
      },
    ],
  },
};
</script>

<script setup lang="ts">
import { StoriesLayout } from "~/layouts";
import { Button } from "~/components/ui";
import type {
  ButtonColor,
  ButtonSize,
  ButtonVariant,
} from "~/components/ui";

const meta = story;

const colors: ButtonColor[] = [
  "primary",
  "secondary",
  "ternary",
  "success",
  "warning",
  "error",
  "transparent",
];
const contentVariants: Exclude<ButtonVariant, "icon" | "iconOutline">[] = [
  "filled",
  "outlined",
  "text",
];
const sizes: ButtonSize[] = ["small", "medium", "large"];
</script>

<template>
  <StoriesLayout v-bind="meta">
    <template #demo>
      <div class="space-y-6">
        <div v-for="variant in contentVariants" :key="variant">
          <p
            class="mb-2 text-xs font-semibold text-foreground-subtle uppercase">
            {{ variant }}
          </p>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="color in colors"
              :key="color"
              :variant="variant"
              :color="color">
              {{ color }}
            </Button>
          </div>
        </div>

        <div>
          <p
            class="mb-2 text-xs font-semibold text-foreground-subtle uppercase">
            Sizes
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <Button v-for="size in sizes" :key="size" :size="size">
              {{ size }}
            </Button>
          </div>
        </div>

        <div>
          <p
            class="mb-2 text-xs font-semibold text-foreground-subtle uppercase">
            States
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <Button>Default</Button>
            <Button disabled>Disabled</Button>
            <Button loading>Loading</Button>
          </div>
        </div>

        <div>
          <p
            class="mb-2 text-xs font-semibold text-foreground-subtle uppercase">
            Block
          </p>
          <Button block>Full-width button</Button>
        </div>

        <div>
          <p
            class="mb-2 text-xs font-semibold text-foreground-subtle uppercase">
            Icon
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <Button variant="icon" color="primary" aria-label="confirm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.1 3.1 6.8-6.8a1 1 0 011.4 0z"
                  clip-rule="evenodd" />
              </svg>
            </Button>
            <Button variant="iconOutline" color="primary" aria-label="confirm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.1 3.1 6.8-6.8a1 1 0 011.4 0z"
                  clip-rule="evenodd" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </template>
  </StoriesLayout>
</template>
