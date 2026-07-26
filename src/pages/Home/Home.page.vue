<script setup lang="ts">
import { RouterLink } from "vue-router";
import { useHomeController } from "./Home.controller";

const { title } = useHomeController();
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
    <h1 class="text-2xl font-bold">{{ title }}</h1>
    <p class="text-gray-600">Welcome to the home page.</p>

    <RouterLink to="/signup" class="text-sm text-blue-500 underline">
      Go to Sign up
    </RouterLink>
  </div>
</template>
