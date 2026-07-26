<script setup lang="ts">
defineProps<{
  sample: string;
  unavailable?: boolean;
  note?: string;
}>();
</script>

<template>
  <div class="space-y-4">
    <div
      v-if="unavailable || note"
      class="rounded-sm border border-warning-50 bg-warning-50/50 p-3 text-sm text-foreground">
      <p class="font-semibold text-warning">
        {{ unavailable ? "Runs on device only" : "Documentation example" }}
      </p>
      <p class="mt-1 text-foreground-muted">
        {{
          note ??
          "URB commands execute inside the native shell. Open this story on an Android or iOS device to use the live demo."
        }}
      </p>
    </div>

    <div>
      <p class="mb-2 text-xs font-semibold text-foreground-subtle uppercase">
        Sample result
      </p>
      <pre
        class="overflow-x-auto rounded-sm border border-border bg-surface-muted p-3 text-sm text-foreground"><code>{{ sample }}</code></pre>
    </div>
  </div>
</template>
