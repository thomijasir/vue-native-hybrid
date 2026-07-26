<script lang="ts">
import type { StoriesLayoutProps } from "~/layouts/Stories/Stories.interface";
import { uiApi } from "./UiStoryApi";

export const story: StoriesLayoutProps = {
  name: "Image",
  category: "ui",
  description:
    "An image container with lazy or eager loading, an internal skeleton while loading, fallback-source retry, an accessible missing-image state, and flexible CSS or pixel dimensions.",
  usageCode: `import { Image } from "~/components/ui";

<Image
  src="/product.jpg"
  fallback-src="/placeholder.jpg"
  alt="Blue running shoe"
  :width="320"
  :height="240"
  loading="lazy"
  @load="onLoad"
  @error="onError"
/>`,
  whenToUse: [
    "Images that need a consistent loading and failure presentation.",
    "When a secondary source should be attempted after the primary source fails.",
    "Always provide meaningful alt text unless the image is purely decorative.",
  ],
  api: uiApi([
    [
      "src",
      "string",
      "—",
      "Primary image URL; omission shows the built-in fallback icon.",
    ],
    [
      "alt",
      "string",
      "—",
      "Accessible image alternative and fallback-icon label.",
    ],
    ["fallbackSrc", "string", "—", "Tried once when the primary source fails."],
    [
      "width / height",
      "string | number",
      '"100%" / "auto"',
      "Numbers become pixels; strings are used as CSS values.",
    ],
    ["loading", '"lazy" | "eager"', '"lazy"', "Native image loading strategy."],
    ["class", "string", "—", "Classes merged onto the outer image container."],
    [
      "@load",
      "(event: Event) => void",
      "—",
      "Emitted after an image source loads.",
    ],
    [
      "@error",
      "(event: Event) => void",
      "—",
      "Emitted for each failed source, including before fallback retry.",
    ],
  ]),
};
</script>

<script setup lang="ts">
import { ref } from "vue";
import { Image, Skeleton } from "~/components/ui";
import { StoriesLayout } from "~/layouts";

const meta = story;
const eventStatus = ref("Waiting for image event");
const localImage = "/favicon.svg";
const missingImage = "/stories-missing-image.png";
</script>

<template>
  <StoriesLayout v-bind="meta">
    <template #demo>
      <div class="space-y-6">
        <section>
          <p
            class="mb-3 text-xs font-semibold text-foreground-subtle uppercase">
            Loaded image
          </p>
          <Image
            :src="localImage"
            alt="Application mark"
            :width="160"
            :height="120"
            class="rounded-sm border border-border p-4"
            loading="eager"
            @load="eventStatus = 'load emitted'"
            @error="eventStatus = 'error emitted'" />
          <p class="mt-2 font-mono text-xs text-foreground-muted">
            {{ eventStatus }}
          </p>
        </section>

        <section>
          <p
            class="mb-3 text-xs font-semibold text-foreground-subtle uppercase">
            Loading placeholder
          </p>
          <div
            class="w-full max-w-sm overflow-hidden rounded-sm border border-border">
            <Skeleton variant="rectangular" width="100%" :height="140" />
          </div>
          <p class="mt-2 text-xs text-foreground-muted">
            Image renders this rectangular skeleton over its content while the
            active source is loading.
          </p>
        </section>

        <section>
          <p
            class="mb-3 text-xs font-semibold text-foreground-subtle uppercase">
            Failure and fallback
          </p>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <Image
                :src="missingImage"
                alt="Missing image example"
                width="100%"
                :height="120"
                class="rounded-sm border border-border" />
              <p class="mt-1 text-xs text-foreground-muted">
                Built-in missing-image state
              </p>
            </div>
            <div>
              <Image
                :src="missingImage"
                :fallback-src="localImage"
                alt="Fallback application mark"
                width="100%"
                :height="120"
                class="rounded-sm border border-border p-4" />
              <p class="mt-1 text-xs text-foreground-muted">
                Broken primary with local fallbackSrc
              </p>
            </div>
          </div>
        </section>
      </div>
    </template>
  </StoriesLayout>
</template>
