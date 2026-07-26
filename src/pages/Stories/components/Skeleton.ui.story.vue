<script lang="ts">
import type { StoriesLayoutProps } from "~/layouts/Stories/Stories.interface";
import { uiApi } from "./UiStoryApi";

export const story: StoriesLayoutProps = {
  name: "Skeleton",
  category: "ui",
  description:
    "A lightweight loading placeholder with text, rectangular, and circular shapes, optional pulse animation, flexible dimensions, and class merging.",
  usageCode: `import { Skeleton } from "~/components/ui";

<Skeleton variant="text" width="70%" />
<Skeleton variant="circular" :width="40" :height="40" />
<Skeleton variant="rectangular" width="100%" :height="160" />`,
  whenToUse: [
    "Representing the approximate shape of content while data loads.",
    "Use a small composition that mirrors the final layout rather than a generic spinner.",
    "Set animation to none when motion should be reduced by application policy.",
  ],
  api: uiApi([
    [
      "variant",
      '"text" | "rectangular" | "circular"',
      '"text"',
      "Controls the placeholder shape.",
    ],
    [
      "width",
      "string | number",
      "variant default",
      "Numbers become pixels; strings are used as CSS values.",
    ],
    [
      "height",
      "string | number",
      "variant default",
      "Numbers become pixels; strings are used as CSS values.",
    ],
    [
      "animation",
      '"pulse" | "none"',
      '"pulse"',
      "Enables or disables the pulse animation.",
    ],
    ["class", "string", "—", "Classes merged with shape and animation styles."],
  ]),
};
</script>

<script setup lang="ts">
import {
  Skeleton,
  type SkeletonAnimation,
  type SkeletonVariant,
} from "~/components/ui";
import { StoriesLayout } from "~/layouts";

const meta = story;
const variants: SkeletonVariant[] = ["text", "rectangular", "circular"];
const animations: SkeletonAnimation[] = ["pulse", "none"];
</script>

<template>
  <StoriesLayout v-bind="meta">
    <template #demo>
      <div class="space-y-6">
        <section>
          <p
            class="mb-3 text-xs font-semibold text-foreground-subtle uppercase">
            Variants
          </p>
          <div class="grid gap-4 sm:grid-cols-3">
            <div v-for="variant in variants" :key="variant">
              <Skeleton
                :variant="variant"
                :width="variant === 'circular' ? 64 : '100%'"
                :height="variant === 'text' ? 18 : 64" />
              <p class="mt-2 font-mono text-xs text-foreground-muted">
                {{ variant }}
              </p>
            </div>
          </div>
        </section>

        <section>
          <p
            class="mb-3 text-xs font-semibold text-foreground-subtle uppercase">
            Animation
          </p>
          <div class="grid gap-4 sm:grid-cols-2">
            <div v-for="animation in animations" :key="animation">
              <Skeleton
                variant="rectangular"
                width="100%"
                :height="48"
                :animation="animation" />
              <p class="mt-2 font-mono text-xs text-foreground-muted">
                {{ animation }}
              </p>
            </div>
          </div>
        </section>

        <section>
          <p
            class="mb-3 text-xs font-semibold text-foreground-subtle uppercase">
            Composed card
          </p>
          <div class="flex max-w-md gap-4 rounded-sm border border-border p-4">
            <Skeleton variant="circular" :width="48" :height="48" />
            <div class="flex-1 space-y-2">
              <Skeleton variant="text" width="45%" />
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="75%" />
            </div>
          </div>
        </section>
      </div>
    </template>
  </StoriesLayout>
</template>
