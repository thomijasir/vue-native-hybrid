<script setup lang="ts">
import { computed, useId } from "vue";
import { twMerge } from "tailwind-merge";
import type {
  RadioProps,
  RadioVariant,
  RadioInputPosition,
} from "./Radio.interface";
import Text from "../Text/Text.component.vue";

const props = withDefaults(defineProps<RadioProps>(), {
  variant: "boxed" as RadioVariant,
  inputPosition: "right" as RadioInputPosition,
});
const model = defineModel<boolean>({ default: false });

const radioId = useId();
const isBoxed = computed(() => props.variant === "boxed");

const boxedClasses = computed(() =>
  twMerge(
    "items-start p-4 rounded-usible-lg border shadow-usible-sm",
    model.value ? "bg-primary-50 border-primary" : "bg-surface border-border",
  ),
);
const plainClasses = "items-center p-0 border-0 bg-transparent";

function onRootClick() {
  if (props.disabled) return;
  document.getElementById(radioId)?.click();
}

function onChange(e: Event) {
  const target = e.target as HTMLInputElement;
  model.value = target.checked;
}
</script>

<template>
  <div
    :class="twMerge(
      'relative flex transition-all duration-200',
      isBoxed ? boxedClasses : plainClasses,
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      error ? 'border-error bg-error-50' : '',
      containerClass,
    )"
    @click="onRootClick"
  >
    <template v-if="inputPosition === 'left'">
      <div class="relative flex items-center h-6 mr-4">
        <input
          :id="radioId"
          type="radio"
          :disabled="disabled"
          :checked="model"
          :name="name"
          :value="value"
          :class="twMerge(
            'peer h-5 w-5 appearance-none rounded-usible-pill border-2 border-border-strong',
            'checked:border-primary checked:bg-primary',
            'focus:outline-none',
            'disabled:border-border disabled:bg-surface-disabled',
            props.class,
          )"
          @change="onChange"
        />
        <div class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden peer-checked:block">
          <div class="w-2 h-2 rounded-usible-pill bg-inverse" />
        </div>
      </div>

      <div v-if="$slots.icon" :class="`mr-4 ${isBoxed ? 'mt-0.5' : ''} text-foreground-muted`">
        <slot name="icon" />
      </div>

      <div class="flex-1">
        <label
          v-if="label || $slots.label"
          :for="radioId"
          :class="`block font-medium text-foreground ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`"
        >
          <slot name="label">{{ label }}</slot>
        </label>
        <Text
          v-if="description || $slots.description"
          variant="caption"
          class="mt-1 text-foreground-muted block"
        >
          <slot name="description">{{ description }}</slot>
        </Text>
      </div>
    </template>

    <template v-else>
      <div v-if="$slots.icon" :class="`mr-4 ${isBoxed ? 'mt-0.5' : ''} text-foreground-muted`">
        <slot name="icon" />
      </div>

      <div class="flex-1 mr-4">
        <label
          v-if="label || $slots.label"
          :for="radioId"
          :class="`block font-medium text-foreground ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`"
        >
          <slot name="label">{{ label }}</slot>
        </label>
        <Text
          v-if="description || $slots.description"
          variant="caption"
          class="mt-1 text-foreground-muted block"
        >
          <slot name="description">{{ description }}</slot>
        </Text>
      </div>

      <div class="relative flex items-center h-6">
        <input
          :id="radioId"
          type="radio"
          :disabled="disabled"
          :checked="model"
          :name="name"
          :value="value"
          :class="twMerge(
            'peer h-5 w-5 appearance-none rounded-usible-pill border-2 border-border-strong',
            'checked:border-primary checked:bg-primary',
            'focus:outline-none',
            'disabled:border-border disabled:bg-surface-disabled',
            props.class,
          )"
          @change="onChange"
        />
        <div class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden peer-checked:block">
          <div class="w-2 h-2 rounded-usible-pill bg-inverse" />
        </div>
      </div>
    </template>
  </div>
</template>
