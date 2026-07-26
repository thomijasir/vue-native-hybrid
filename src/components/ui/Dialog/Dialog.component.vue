<script setup lang="ts">
import { ref } from "vue";
import { twMerge } from "tailwind-merge";
import Backdrop from "~/components/ui/Backdrop/Backdrop.component.vue";
import { useModalSurface } from "~/components/ui/useModalSurface";
import type { DialogProps } from "./Dialog.interface";

const props = withDefaults(defineProps<DialogProps>(), {
  closeOnBackdrop: true,
  closeOnEscape: true,
  backdropOpacity: 0.5,
  maxWidth: "32rem",
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
    <Transition name="dialog">
      <div
        v-if="model"
        class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <section
          ref="surface"
          role="dialog"
          aria-modal="true"
          :aria-label="ariaLabel"
          tabindex="-1"
          :class="
            twMerge(
              'dialog-surface pointer-events-auto w-full max-h-[calc(100svh-2rem)] transform-gpu overflow-y-auto rounded-lg border border-border bg-surface p-6 text-foreground shadow-usible-lg focus:outline-none',
              props.class,
            )
          "
          :style="{ maxWidth }">
          <slot />
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-enter-active {
  transition: opacity 300ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity;
}

.dialog-leave-active {
  transition: opacity 220ms cubic-bezier(0.4, 0, 1, 1);
  will-change: opacity;
}

.dialog-enter-active .dialog-surface {
  transition:
    opacity 300ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 300ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform;
  backface-visibility: hidden;
}

.dialog-leave-active .dialog-surface {
  transition:
    opacity 180ms cubic-bezier(0.4, 0, 1, 1),
    transform 220ms cubic-bezier(0.4, 0, 1, 1);
  will-change: opacity, transform;
  backface-visibility: hidden;
}

.dialog-enter-from,
.dialog-leave-to,
.dialog-enter-from .dialog-surface,
.dialog-leave-to .dialog-surface {
  opacity: 0;
}

.dialog-enter-from .dialog-surface,
.dialog-leave-to .dialog-surface {
  transform: translate3d(0, 8px, 0) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .dialog-enter-active,
  .dialog-leave-active,
  .dialog-enter-active .dialog-surface,
  .dialog-leave-active .dialog-surface {
    transition-duration: 0.01ms;
  }
}
</style>
