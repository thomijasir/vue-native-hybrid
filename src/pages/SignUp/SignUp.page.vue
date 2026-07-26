<script setup lang="ts">
import { Text } from "~/components/ui";
import { RouterLink } from "vue-router";
import { useSignUpController } from "./SignUp.controller";

const { email, password, onSubmit } = useSignUpController();
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
    <Text variant="h1" class="text-2xl font-bold">Sign up</Text>
    <form
      class="flex w-full max-w-sm flex-col gap-3"
      @submit.prevent="onSubmit">
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        class="rounded-sm border border-gray-300 px-4 py-2" />
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        class="rounded-sm border border-gray-300 px-4 py-2" />
      <button
        class="rounded-sm bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700">
        <Text
          variant="button"
          class="text-base font-bold text-current normal-case">
          Create account
        </Text>
      </button>
    </form>

    <RouterLink to="/home" class="text-sm text-blue-500 underline">
      <Text
        variant="button"
        class="text-sm font-normal text-current normal-case">
        Go to Home
      </Text>
    </RouterLink>
  </div>
</template>
