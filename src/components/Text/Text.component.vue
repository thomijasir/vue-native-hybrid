<script setup lang="ts">
import { computed } from "vue";
import { twMerge } from "tailwind-merge";
import type { TextProps, TextVariant, TextColor } from "./Text.interface";

type HTMLElementTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";

const props = withDefaults(defineProps<TextProps>(), {
  variant: "body1" as TextVariant,
  color: "text" as TextColor,
});

const variantMapping: Record<TextVariant, HTMLElementTag> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  subtitle1: "h6",
  subtitle2: "h6",
  body1: "p",
  body2: "p",
  button: "span",
  caption: "span",
  overline: "span",
};

const variantClasses: Record<TextVariant, string> = {
  h1: "text-5xl font-bold",
  h2: "text-4xl font-bold",
  h3: "text-3xl font-bold",
  h4: "text-2xl font-bold",
  h5: "text-xl font-bold",
  h6: "text-lg font-bold",
  subtitle1: "text-base font-medium",
  subtitle2: "text-sm font-medium",
  body1: "text-base",
  body2: "text-sm",
  button: "text-sm font-medium uppercase",
  caption: "text-xs",
  overline: "text-xs uppercase",
};

const colorClasses: Record<TextColor, string> = {
  primary: "text-primary",
  secondary: "text-secondary",
  ternary: "text-ternary",
  text: "text-foreground",
  error: "text-error",
  success: "text-success",
  warning: "text-warning",
  white: "text-inverse",
};

const tag = computed(() => variantMapping[props.variant]);
const classes = computed(() =>
  twMerge(variantClasses[props.variant], colorClasses[props.color], props.class),
);
</script>

<template>
  <component :is="tag" :class="classes">
    <slot />
  </component>
</template>
