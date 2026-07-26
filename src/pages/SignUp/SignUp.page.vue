<script setup lang="ts">
import { RouterLink } from "vue-router";
import { useSignUpController } from "./SignUp.controller";

const { email, password, onSubmit } = useSignUpController();
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
    <h1 class="text-2xl font-bold">Sign up</h1>
    <form
      class="flex w-full max-w-sm flex-col gap-3"
      @submit.prevent="onSubmit">
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        class="rounded border border-gray-300 px-4 py-2" />
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        class="rounded border border-gray-300 px-4 py-2" />
      <button
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Create account
      </button>
    </form>

    <RouterLink to="/home" class="text-sm text-blue-500 underline">
      Go to Home
    </RouterLink>
  </div>
</template>
