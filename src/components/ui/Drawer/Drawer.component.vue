<script setup lang="ts">
import { ref } from "vue";
import { twMerge } from "tailwind-merge";
import Backdrop from "~/components/ui/Backdrop/Backdrop.component.vue";
import { useModalSurface } from "~/components/ui/useModalSurface";
import type { DrawerProps } from "./Drawer.interface";

const props = withDefaults(defineProps<DrawerProps>(), {
  closeOnBackdrop: true,
  closeOnEscape: true,
  backdropOpacity: 0.5,
  maxHeight: "90svh",
});
const model = defineModel<boolean>({ default: false });
const surface = ref<HTMLElement | null>(null);
const { dismiss } = useModalSurface(model, surface, () => props.closeOnEscape);

const onBackdropClick = () => {
  if (props.closeOnBackdrop) dismiss();
};
</script>

<template>
  <Teleport to="body">
    <Backdrop
      :is-open="model"
      :opacity="backdropOpacity"
      @click="onBackdropClick" />
    <Transition name="drawer">
      <section
        v-if="model"
        ref="surface"
        role="dialog"
        aria-modal="true"
        :aria-label="ariaLabel"
        tabindex="-1"
        :class="
          twMerge(
            'drawer-surface fixed inset-x-0 bottom-0 z-50 transform-gpu overflow-y-auto rounded-t-sm border border-b-0 border-border bg-surface px-6 pt-6 text-foreground shadow-usible-lg focus:outline-none',
            props.class,
          )
        "
        :style="{ maxHeight }">
        <slot />
      </section>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-surface {
  padding-bottom: max(1.5rem, var(--safe-area-bottom));
}

.drawer-enter-active {
  transition:
    opacity 320ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform;
  backface-visibility: hidden;
}

.drawer-leave-active {
  transition:
    opacity 220ms cubic-bezier(0.4, 0, 1, 1),
    transform 260ms cubic-bezier(0.4, 0, 1, 1);
  will-change: opacity, transform;
  backface-visibility: hidden;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translate3d(0, 100%, 0);
}

@media (prefers-reduced-motion: reduce) {
  .drawer-enter-active,
  .drawer-leave-active {
    transition-duration: 0.01ms;
  }
}
</style>
