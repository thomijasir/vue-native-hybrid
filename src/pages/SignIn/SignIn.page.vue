<script setup lang="ts">
import { Button, Input, Text } from "~/components/ui";
import { SafeAreaLayout } from "~/layouts";
import { useSignInController } from "./SignIn.controller";

const { email, password, error, onSubmit } = useSignInController();
</script>

<template>
  <SafeAreaLayout>
    <div class="flex min-h-screen items-center justify-center p-6">
      <section class="flex w-full max-w-sm flex-col gap-6">
        <header class="space-y-2 text-center">
          <Text variant="h2">Sign in</Text>
          <Text variant="body2" color="ternary">
            This screen uses a sample in-memory store. Any email and password
            will work.
          </Text>
        </header>

        <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
          <Input
            id="signin-email"
            v-model="email"
            type="email"
            label="Email"
            placeholder="you@example.com" />
          <Input
            id="signin-password"
            v-model="password"
            type="password"
            label="Password"
            placeholder="Enter any password" />

          <Text v-if="error" variant="caption" color="error" role="alert">
            {{ error }}
          </Text>

          <Button type="submit" block>
            <Text
              variant="button"
              class="text-base font-semibold text-current normal-case">
              Sign in
            </Text>
          </Button>
        </form>
      </section>
    </div>
  </SafeAreaLayout>
</template>
