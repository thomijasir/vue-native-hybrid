<script setup lang="ts">
import { computed } from "vue";
import type { BackdropProps } from "./Backdrop.interface";

const props = withDefaults(defineProps<BackdropProps>(), {
  opacity: 0.5,
});
const emit = defineEmits<{ (e: "click", event: MouseEvent): void }>();

const targetOpacity = computed(() => props.opacity);
</script>

<template>
  <Transition name="backdrop">
    <div
      v-show="isOpen"
      aria-hidden="true"
      class="fixed inset-0 bg-backdrop z-40 backdrop-blur-md backdrop"
      :style="{
        '--bd-opacity': targetOpacity,
        'touch-action': 'none',
        'backdrop-filter': 'blur(8px)',
      }"
      @click="(e) => emit('click', e)"
    />
  </Transition>
</template>

<style scoped>
.backdrop {
  opacity: var(--bd-opacity, 0.5);
}
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0 !important;
}
</style>
