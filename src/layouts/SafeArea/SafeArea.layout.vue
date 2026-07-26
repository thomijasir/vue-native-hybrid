<script setup lang="ts">
import { twMerge } from "tailwind-merge";
import type { SafeAreaLayoutProps } from "./SafeArea.interface";

const props = withDefaults(defineProps<SafeAreaLayoutProps>(), {
  containerClass: "",
  contentClass: "",
});
</script>

<template>
  <main :class="twMerge('safe-area', props.containerClass)">
    <div :class="twMerge('safe-area__content', props.contentClass)">
      <slot />
    </div>
  </main>
</template>
