<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { twMerge } from "tailwind-merge";
import type { ImageProps } from "./Image.interface";
import Skeleton from "../Skeleton/Skeleton.component.vue";

const props = withDefaults(defineProps<ImageProps>(), {
  loading: "lazy",
});
const emit = defineEmits<{
  (e: "load", event: Event): void;
  (e: "error", event: Event): void;
}>();

const imgSrc = ref<string | undefined>(props.src);
const isLoading = ref(!!props.src);
const hasError = ref(false);

watch(
  () => props.src,
  (src) => {
    if (src) {
      imgSrc.value = src;
      isLoading.value = true;
      hasError.value = false;
    } else {
      imgSrc.value = undefined;
      isLoading.value = false;
    }
  },
);

function handleLoad(e: Event) {
  isLoading.value = false;
  emit("load", e);
}

function handleError(e: Event) {
  if (props.fallbackSrc && imgSrc.value !== props.fallbackSrc) {
    imgSrc.value = props.fallbackSrc;
    isLoading.value = true;
    hasError.value = false;
  } else {
    isLoading.value = false;
    hasError.value = true;
  }
  emit("error", e);
}

const containerStyle = computed(() => {
  const s: Record<string, string> = {};
  s.width =
    typeof props.width === "number" ? `${props.width}px` : props.width || "100%";
  s.height =
    typeof props.height === "number" ? `${props.height}px` : props.height || "auto";
  return s;
});

const showFallback = computed(
  () => !imgSrc.value || (hasError.value && !props.fallbackSrc),
);
</script>

<template>
  <div
    :class="twMerge('relative overflow-hidden bg-surface-muted', props.class)"
    :style="containerStyle"
  >
    <div v-if="isLoading" class="absolute inset-0">
      <Skeleton
        variant="rectangular"
        width="100%"
        height="100%"
        animation="pulse"
      />
    </div>

    <div
      v-if="showFallback"
      class="w-full h-full flex items-center justify-center text-foreground-subtle"
      data-testid="image-fallback"
    >
      <svg
        class="w-12 h-12"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        :aria-label="alt || 'Image load error'"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>

    <img
      v-else
      :src="imgSrc"
      :alt="alt"
      :loading="loading"
      :class="twMerge(
        'w-full h-full object-cover transition-opacity duration-300',
        isLoading ? 'opacity-0' : 'opacity-100',
      )"
      @load="handleLoad"
      @error="handleError"
    />
  </div>
</template>
