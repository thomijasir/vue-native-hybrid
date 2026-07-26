<script setup lang="ts">
import { computed } from "vue";
import { twMerge } from "tailwind-merge";
import type {
  ButtonProps,
  ButtonVariant,
  ButtonColor,
  ButtonSize,
} from "./Button.interface";

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: "filled" as ButtonVariant,
  color: "primary" as ButtonColor,
  size: "medium" as ButtonSize,
  type: "button",
});
const emit = defineEmits<{ (e: "click", event: MouseEvent): void }>();

const baseClasses =
  "select-none inline-flex items-center justify-center rounded-sm font-semibold focus:outline-none transition-colors duration-200 relative overflow-hidden";

const variantClasses: Record<ButtonVariant, Record<ButtonColor, string>> = {
  filled: {
    primary:
      "bg-primary text-inverse hover:bg-primary-dark active:bg-primary-dark",
    secondary:
      "bg-secondary text-inverse hover:bg-secondary-dark active:bg-secondary-dark",
    ternary:
      "bg-ternary text-inverse hover:bg-ternary-dark active:bg-ternary-dark",
    success:
      "bg-success text-inverse hover:bg-success-dark active:bg-success-dark",
    warning:
      "bg-warning text-inverse hover:bg-warning-dark active:bg-warning-dark",
    error: "bg-error text-inverse hover:bg-error-dark active:bg-error-dark",
    transparent:
      "bg-transparent text-current hover:opacity-80 active:opacity-70",
  },
  outlined: {
    primary:
      "border border-primary text-primary hover:bg-primary hover:text-inverse active:bg-primary active:text-inverse",
    secondary:
      "border border-secondary text-secondary hover:bg-secondary hover:text-inverse active:bg-secondary active:text-inverse",
    ternary:
      "border border-ternary text-ternary hover:bg-ternary hover:text-inverse active:bg-ternary active:text-inverse",
    success:
      "border border-success text-success hover:bg-success hover:text-inverse active:bg-success active:text-inverse",
    warning:
      "border border-warning text-warning hover:bg-warning hover:text-inverse active:bg-warning active:text-inverse",
    error:
      "border border-error text-error hover:bg-error hover:text-inverse active:bg-error active:text-inverse",
    transparent:
      "border border-current text-current hover:opacity-80 active:opacity-70",
  },
  text: {
    primary: "text-primary hover:bg-primary-light",
    secondary: "text-secondary hover:bg-secondary-light",
    ternary: "text-ternary hover:bg-ternary-light",
    success: "text-success hover:bg-success-light",
    warning: "text-warning hover:bg-warning-light",
    error: "text-error hover:bg-error-light",
    transparent: "text-current hover:opacity-80",
  },
  icon: {
    primary: "text-primary hover:bg-primary-50 rounded-full",
    secondary: "text-secondary hover:bg-secondary-50 rounded-full",
    ternary: "text-ternary hover:bg-ternary-50 rounded-full",
    success: "text-success hover:bg-success-50 rounded-full",
    warning: "text-warning hover:bg-warning-50 rounded-full",
    error: "text-error hover:bg-error-50 rounded-full",
    transparent: "text-current hover:opacity-80 rounded-full",
  },
  iconOutline: {
    primary:
      "border border-primary text-primary hover:bg-primary hover:text-inverse active:bg-primary active:text-inverse rounded-full",
    secondary:
      "border border-secondary text-secondary hover:bg-secondary hover:text-inverse active:bg-secondary active:text-inverse rounded-full",
    ternary:
      "border border-ternary text-ternary hover:bg-ternary hover:text-inverse active:bg-ternary active:text-inverse rounded-full",
    success:
      "border border-success text-success hover:bg-success hover:text-inverse active:bg-success active:text-inverse rounded-full",
    warning:
      "border border-warning text-warning hover:bg-warning hover:text-inverse active:bg-warning active:text-inverse rounded-full",
    error:
      "border border-error text-error hover:bg-error hover:text-inverse active:bg-error active:text-inverse rounded-full",
    transparent:
      "border border-current text-current hover:opacity-80 active:opacity-70 rounded-full",
  },
};

const sizeClasses: Record<ButtonSize, string> = {
  small: "px-4 py-2.5 text-sm",
  medium: "px-5 py-3 text-base",
  large: "px-6 py-4 text-lg",
};

const iconSizeClasses: Record<ButtonSize, string> = {
  small: "p-1.5 aspect-square",
  medium: "p-2 aspect-square",
  large: "p-3 aspect-square",
};

const disabledClasses = "opacity-50 cursor-not-allowed pointer-events-none";

const loaderColorMap: Record<
  ButtonColor,
  "primary" | "secondary" | "white" | "current"
> = {
  primary: "white",
  secondary: "white",
  ternary: "white",
  success: "white",
  warning: "white",
  error: "white",
  transparent: "current",
};

const isDisabled = computed(() => props.disabled || props.loading);
const isIcon = computed(
  () => props.variant === "icon" || props.variant === "iconOutline",
);

const classes = computed(() =>
  twMerge(
    baseClasses,
    variantClasses[props.variant][props.color],
    isIcon.value ? iconSizeClasses[props.size] : sizeClasses[props.size],
    props.block ? "w-full" : "",
    isDisabled.value ? disabledClasses : "",
    isDisabled.value
      ? ""
      : "active:scale-98 active:opacity-90 transform transition-all duration-150",
    props.class,
  ),
);

const loaderColor = computed(() =>
  props.variant === "filled" ? loaderColorMap[props.color] : "current",
);
const loaderSize = computed(() =>
  props.size === "large" ? "medium" : "small",
);

const loaderSizeClass = computed(() =>
  loaderSize.value === "medium" ? "w-5 h-5" : "w-4 h-4",
);
const loaderColorClass = computed(() => {
  switch (loaderColor.value) {
    case "primary":
      return "text-primary";
    case "secondary":
      return "text-secondary";
    case "white":
      return "text-inverse";
    default:
      return "text-current";
  }
});

function onClick(event: MouseEvent) {
  if (isDisabled.value) return;
  emit("click", event);
}
</script>

<template>
  <button
    :class="classes"
    :disabled="isDisabled"
    :type="type"
    :aria-busy="loading"
    style="-webkit-tap-highlight-color: transparent"
    @click="onClick">
    <span
      v-if="loading"
      role="status"
      aria-live="polite"
      class="inline-flex items-center mr-2">
      <svg
        :class="`animate-spin ${loaderSizeClass} ${loaderColorClass}`"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24">
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4" />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </span>
    <slot />
  </button>
</template>
