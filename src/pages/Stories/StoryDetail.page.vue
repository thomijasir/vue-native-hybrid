<script setup lang="ts">
import { useStoryDetailController } from "./StoryDetail.controller";

const { entry } = useStoryDetailController();
</script>

<template>
  <component :is="entry?.component" v-if="entry" />
</template>
