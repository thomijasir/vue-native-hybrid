<script lang="ts">
import { urbStoryCatalog } from "./UrbStoryCatalog";
export const story = urbStoryCatalog.networkStatusChange.meta;
</script>
<script setup lang="ts">
import UrbStoryRenderer from "./UrbStoryRenderer.vue";
</script>
<template><UrbStoryRenderer story-id="networkStatusChange" /></template>
