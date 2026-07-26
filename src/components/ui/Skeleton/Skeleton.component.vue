<script setup lang="ts">
import { computed } from "vue";
import { twMerge } from "tailwind-merge";
import type {
  SkeletonProps,
  SkeletonVariant,
  SkeletonAnimation,
} from "./Skeleton.interface";

const props = withDefaults(defineProps<SkeletonProps>(), {
  variant: "text" as SkeletonVariant,
  animation: "pulse" as SkeletonAnimation,
});

const variantClasses: Record<SkeletonVariant, string> = {
  text: "rounded-sm mt-1 mb-1 h-4 w-full",
  rectangular: "rounded-sm",
  circular: "rounded-full",
};

const animationClasses: Record<SkeletonAnimation, string> = {
  pulse: "animate-pulse",
  none: "",
};

const classes = computed(() =>
  twMerge(
    "bg-surface-subtle",
    variantClasses[props.variant],
    animationClasses[props.animation],
    props.class,
  ),
);

const style = computed(() => {
  const s: Record<string, string | number | undefined> = {};
  if (props.width !== undefined)
    s.width =
      typeof props.width === "number" ? `${props.width}px` : props.width;
  if (props.height !== undefined)
    s.height =
      typeof props.height === "number" ? `${props.height}px` : props.height;
  return s;
});
</script>

<template>
  <div :class="classes" :style="style" />
</template>
