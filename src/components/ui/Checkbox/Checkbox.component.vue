<script setup lang="ts">
import { computed, useId } from "vue";
import { twMerge } from "tailwind-merge";
import type { CheckboxProps, CheckboxSize } from "./Checkbox.interface";
import Text from "~/components/ui/Text/Text.component.vue";

const props = withDefaults(defineProps<CheckboxProps>(), {
  size: "medium" as CheckboxSize,
});
const model = defineModel<boolean>({ default: false });

const fallbackId = useId();
const inputId = computed(() => props.id ?? fallbackId);
const isError = computed(() => !!props.error);
const errorId = computed(() => `${inputId.value}-error`);

const sizeClasses: Record<CheckboxSize, string> = {
  small: "h-5 w-5",
  medium: "h-6 w-6",
  large: "h-7 w-7",
};

const checkmarkSizeClasses: Record<CheckboxSize, string> = {
  small: "w-3 h-3",
  medium: "w-4 h-4",
  large: "w-5 h-5",
};

function handleChange(e: Event) {
  const target = e.target as HTMLInputElement;
  model.value = target.checked;
}
</script>

<template>
  <div
    :class="
      twMerge(
        'relative flex items-center',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        containerClass,
      )
    ">
    <div class="relative flex items-center">
      <input
        :id="inputId"
        type="checkbox"
        :checked="model"
        :disabled="disabled"
        :aria-invalid="isError ? 'true' : undefined"
        :aria-describedby="isError ? errorId : undefined"
        :class="
          twMerge(
            'peer appearance-none rounded-sm border-2 transition-colors duration-200',
            'checked:bg-primary checked:border-primary',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
            'disabled:bg-surface-disabled disabled:border-border',
            isError ? 'border-error' : 'border-border-strong',
            sizeClasses[size],
            props.class,
          )
        "
        @change="handleChange" />
      <div
        :class="
          twMerge(
            'pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'text-inverse opacity-0 peer-checked:opacity-100 transition-opacity duration-200 flex items-center justify-center',
            checkmarkSizeClasses[size],
          )
        ">
        <svg
          class="w-full h-full"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="3">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>

    <label
      v-if="label || $slots.label"
      :for="inputId"
      :class="
        twMerge(
          'ml-3 select-none',
          disabled
            ? 'cursor-not-allowed text-foreground-disabled'
            : 'cursor-pointer text-foreground',
        )
      ">
      <slot name="label">
        <Text variant="body2">{{ label }}</Text>
      </slot>
    </label>

    <div
      v-if="isError && typeof error === 'string'"
      :id="errorId"
      class="sr-only">
      {{ error }}
    </div>
  </div>
</template>
