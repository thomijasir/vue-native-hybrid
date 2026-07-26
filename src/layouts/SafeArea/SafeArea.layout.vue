<script setup lang="ts">
import type { SafeAreaLayoutProps } from "./SafeArea.interface";
const props = withDefaults(defineProps<SafeAreaLayoutProps>(), {
  class: "",
  contentClass: "",
});
</script>

<template>
  <main :class="`safe-area ${props.class}`">
    <div :class="`safe-area__content ${props.contentClass}`">
      <slot />
    </div>
  </main>
</template>
