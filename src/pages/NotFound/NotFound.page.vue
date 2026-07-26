<script setup lang="ts">
import { Text } from "~/components/ui";
import { useNotFoundController } from "./NotFound.controller";

const { code, message, goBack } = useNotFoundController();
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
    <Text variant="body1" class="text-7xl font-bold text-gray-300">
      {{ code }}
    </Text>
    <Text variant="h1" class="text-2xl font-bold">{{ message }}</Text>
    <Text variant="body1" class="text-gray-600">
      The page you're looking for doesn't exist.
    </Text>

    <button
      type="button"
      class="mt-2 rounded-sm bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
      @click="goBack">
      <Text
        variant="button"
        class="text-base font-bold text-current normal-case">
        Go back
      </Text>
    </button>
  </div>
</template>
