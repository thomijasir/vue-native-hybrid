<script setup lang="ts">
import { computed, ref, useId } from "vue";
import { twMerge } from "tailwind-merge";
import type { InputProps, InputSize, TextCase } from "./Input.interface";
import Text from "~/components/ui/Text/Text.component.vue";

const props = withDefaults(defineProps<InputProps>(), {
  size: "medium" as InputSize,
  textCase: "normal" as TextCase,
  fullWidth: true,
  type: "text",
});
const emit = defineEmits<{
  (e: "change", value: string): void;
  (e: "blur", event: FocusEvent): void;
  (e: "focus", event: FocusEvent): void;
  (e: "click", event: MouseEvent): void;
}>();

const model = defineModel<string>({ default: "" });

const fallbackId = useId();
const inputId = computed(() => props.id ?? fallbackId);
const isError = computed(() => !!props.error);
const errorId = computed(() => `${inputId.value}-error`);
const helperId = computed(() => `${inputId.value}-helper`);

const inputRef = ref<HTMLInputElement | null>(null);
defineExpose({ input: inputRef });

const sizeClasses: Record<InputSize, string> = {
  small: "py-2 px-3 text-sm",
  medium: "py-3 px-3 text-base",
  large: "py-4 px-4 text-lg",
};

function applyTextCase(value: string): string {
  if (props.textCase === "uppercase") return value.toUpperCase();
  if (props.textCase === "lowercase") return value.toLowerCase();
  return value;
}

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement;
  const value = applyTextCase(target.value);
  target.value = value;
  model.value = value;
}

function handleChange(e: Event) {
  const target = e.target as HTMLInputElement;
  emit("change", applyTextCase(target.value));
}

const ariaDescribedBy = computed(() => {
  if (isError.value && typeof props.error === "string") return errorId.value;
  if (props.helperText) return helperId.value;
  return undefined;
});
</script>

<template>
  <div
    :class="
      twMerge('flex flex-col', fullWidth ? 'w-full' : '', containerClass)
    ">
    <label
      v-if="label"
      :for="inputId"
      :class="
        twMerge(
          'mb-1.5 text-sm font-medium text-foreground',
          disabled ? 'opacity-50' : '',
        )
      ">
      {{ label }}
    </label>

    <div class="relative">
      <div
        :class="
          twMerge(
            'flex items-center w-full rounded-sm border bg-surface-muted transition-colors duration-200',
            isError
              ? 'border-error bg-error-50 text-error focus-within:border-error'
              : 'border-border-strong focus-within:bg-surface focus-within:border-primary',
            disabled
              ? 'opacity-50 cursor-not-allowed bg-surface-disabled'
              : 'cursor-pointer',
          )
        "
        @click="(e) => emit('click', e)">
        <div
          v-if="$slots.start"
          class="pl-3 text-foreground-muted flex items-center justify-center">
          <slot name="start" />
        </div>

        <input
          :id="inputId"
          ref="inputRef"
          :type="type"
          :value="model"
          :disabled="disabled"
          :placeholder="placeholder"
          :aria-invalid="isError ? 'true' : undefined"
          :aria-describedby="ariaDescribedBy"
          :class="
            twMerge(
              'w-full bg-transparent text-foreground placeholder-placeholder focus:outline-none disabled:cursor-not-allowed',
              sizeClasses[size],
              $slots.start ? 'pl-2' : '',
              $slots.end ? 'pr-2' : '',
              props.class,
            )
          "
          @input="handleInput"
          @change="handleChange"
          @blur="(e) => emit('blur', e)"
          @focus="(e) => emit('focus', e)" />

        <div
          v-if="$slots.end"
          class="pr-3 text-foreground-muted flex items-center justify-center">
          <slot name="end" />
        </div>
      </div>
    </div>

    <div
      v-if="helperText || (isError && typeof error === 'string')"
      class="mt-1 text-xs">
      <span v-if="isError && typeof error === 'string'" :id="errorId">
        <Text variant="caption" color="error">{{ error }}</Text>
      </span>
      <span v-else-if="helperText" :id="helperId">
        <Text variant="caption" color="ternary">{{ helperText }}</Text>
      </span>
    </div>
  </div>
</template>
