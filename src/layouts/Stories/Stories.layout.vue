<script setup lang="ts">
import { ref, computed } from "vue";
import { RouterLink } from "vue-router";
import { SafeAreaLayout } from "../";
import { ArrowLeftIcon } from "~/assets/icons";
import type { StoriesLayoutProps } from "./Stories.interface";

const props = defineProps<StoriesLayoutProps>();

const copied = ref(false);

const categoryLabel = computed(() => (props.category === "ui" ? "UI" : "URB"));

const categoryBadgeClass = computed(() =>
  props.category === "ui"
    ? "bg-primary-50 text-primary"
    : "bg-secondary-50 text-secondary",
);

const apiTitle = computed(() =>
  props.category === "ui" ? "Props" : "Params & result",
);

async function copyUsage() {
  try {
    await navigator.clipboard.writeText(props.usageCode);
    copied.value = true;
    window.setTimeout(() => {
      copied.value = false;
    }, 1500);
  } catch {
    // Clipboard may be unavailable (e.g. non-secure context); fail silently.
  }
}
</script>

<template>
  <SafeAreaLayout>
    <div class="mx-auto w-full max-w-3xl px-4 pt-4">
      <RouterLink
        to="/stories"
        class="inline-flex items-center gap-1 text-md font-medium text-foreground-muted hover:text-foreground">
        <ArrowLeftIcon class="h-4 w-4" />
        Back
      </RouterLink>

      <div class="mt-2 flex items-center gap-2.5">
        <h1 class="text-xl font-bold text-foreground">{{ name }}</h1>
        <span
          :class="`rounded-full px-2 py-0.5 text-xs font-semibold ${categoryBadgeClass}`">
          {{ categoryLabel }}
        </span>
      </div>

      <p class="mt-1.5 text-sm leading-snug text-foreground-muted">
        {{ description }}
      </p>

      <section class="mt-4">
        <h2 class="text-sm font-semibold text-foreground">Demo</h2>
        <div class="mt-1.5 rounded-sm border border-border bg-surface p-2.5">
          <slot name="demo" />
        </div>
      </section>

      <section class="mt-4">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-foreground">How to use</h2>
          <button
            type="button"
            class="rounded-sm border border-border px-2.5 py-1 text-xs font-medium text-foreground-muted hover:bg-surface-hover"
            @click="copyUsage">
            {{ copied ? "Copied!" : "Copy" }}
          </button>
        </div>
        <pre
          class="mt-1.5 overflow-x-auto rounded-sm border border-border bg-surface-muted p-2.5 text-sm leading-snug text-foreground"><code>{{ usageCode }}</code></pre>
      </section>

      <section v-if="api" class="mt-4">
        <h2 class="text-sm font-semibold text-foreground">{{ apiTitle }}</h2>
        <div class="mt-1.5 overflow-x-auto rounded-sm border border-border">
          <table class="min-w-full border-collapse text-left text-sm">
            <thead class="bg-surface-muted text-foreground-muted">
              <tr>
                <th
                  v-for="column in api.columns"
                  :key="column.key"
                  class="whitespace-nowrap border-b border-border px-2.5 py-1.5 font-semibold">
                  {{ column.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, index) in api.rows"
                :key="index"
                class="even:bg-surface-muted/50">
                <td
                  v-for="column in api.columns"
                  :key="column.key"
                  class="whitespace-nowrap border-b border-border px-2.5 py-1.5 align-top text-foreground">
                  {{ row[column.key] }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="mt-4">
        <h2 class="text-sm font-semibold text-foreground">When to use</h2>
        <ul
          class="mt-1.5 list-disc space-y-1 pl-5 text-sm text-foreground-muted">
          <li v-for="(item, index) in whenToUse" :key="index">{{ item }}</li>
        </ul>
      </section>
    </div>
  </SafeAreaLayout>
</template>
