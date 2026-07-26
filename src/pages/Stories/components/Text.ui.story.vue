<script lang="ts">
import type { StoriesLayoutProps } from "~/layouts/Stories/Stories.interface";
import { uiApi } from "./UiStoryApi";

export const story: StoriesLayoutProps = {
  name: "Text",
  category: "ui",
  description:
    "A semantic typography component mapping design-system variants to headings, paragraphs, or spans with themed colors and class merging.",
  usageCode: `import { Text } from "~/components/ui";

<Text variant="h2" color="primary">Account summary</Text>
<Text variant="body2" color="ternary">
  Updated a few seconds ago
</Text>`,
  whenToUse: [
    "Applying consistent typography and semantic elements from the design system.",
    "Choose heading levels by document hierarchy, not merely visual size.",
    "Use body and caption variants for prose and supporting information.",
  ],
  api: uiApi([
    [
      "variant",
      '"h1" | … | "overline"',
      '"body1"',
      "Selects typography classes and the rendered semantic tag.",
    ],
    [
      "color",
      '"primary" | "secondary" | "ternary" | "text" | "success" | "warning" | "error" | "white"',
      '"text"',
      "Applies a design-system foreground color.",
    ],
    [
      "class",
      "string",
      "—",
      "Classes merged after the variant and color classes.",
    ],
    [
      "default slot",
      "content",
      "—",
      "Text or inline content rendered inside the semantic element.",
    ],
    [
      "heading mapping",
      "h1–h6",
      "variant",
      "Heading variants render the matching heading element.",
    ],
    ["body mapping", "p", "variant", "body1 and body2 render paragraphs."],
    [
      "inline mapping",
      "span",
      "variant",
      "button, caption, and overline render spans.",
    ],
  ]),
};
</script>

<script setup lang="ts">
import { Text, type TextColor, type TextVariant } from "~/components/ui";
import { StoriesLayout } from "~/layouts";

const meta = story;
const variants: TextVariant[] = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "subtitle1",
  "subtitle2",
  "body1",
  "body2",
  "button",
  "caption",
  "overline",
];
const colors: TextColor[] = [
  "primary",
  "secondary",
  "ternary",
  "text",
  "success",
  "warning",
  "error",
  "white",
];

const semanticTag: Record<TextVariant, string> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  subtitle1: "h6",
  subtitle2: "h6",
  body1: "p",
  body2: "p",
  button: "span",
  caption: "span",
  overline: "span",
};
</script>

<template>
  <StoriesLayout v-bind="meta">
    <template #demo>
      <div class="space-y-6">
        <section>
          <p
            class="mb-3 text-xs font-semibold text-foreground-subtle uppercase">
            Typography scale
          </p>
          <div class="space-y-3">
            <div
              v-for="variant in variants"
              :key="variant"
              class="border-b border-border pb-2 last:border-0">
              <p class="mb-1 font-mono text-xs text-foreground-subtle">
                {{ variant }} → &lt;{{ semanticTag[variant] }}&gt;
              </p>
              <Text :variant="variant">The quick brown fox</Text>
            </div>
          </div>
        </section>

        <section>
          <p
            class="mb-3 text-xs font-semibold text-foreground-subtle uppercase">
            Colors
          </p>
          <div class="grid gap-2 sm:grid-cols-2">
            <div
              v-for="color in colors"
              :key="color"
              :class="color === 'white' ? 'rounded-sm bg-backdrop p-2' : 'p-2'">
              <Text variant="body2" :color="color">{{ color }}</Text>
            </div>
          </div>
        </section>

        <section>
          <p
            class="mb-3 text-xs font-semibold text-foreground-subtle uppercase">
            Class override
          </p>
          <Text
            variant="body1"
            color="primary"
            class="font-mono tracking-widest">
            Custom classes merge with the selected variant.
          </Text>
        </section>
      </div>
    </template>
  </StoriesLayout>
</template>
