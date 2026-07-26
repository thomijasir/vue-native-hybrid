<script setup lang="ts">
import { useNotFoundController } from './NotFound.controller'

const { code, message, goBack } = useNotFoundController()
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
    <p class="text-7xl font-bold text-gray-300">{{ code }}</p>
    <h1 class="text-2xl font-bold">{{ message }}</h1>
    <p class="text-gray-600">The page you're looking for doesn't exist.</p>

    <button
      type="button"
      class="mt-2 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
      @click="goBack"
    >
      Go back
    </button>
  </div>
</template>
