<script setup lang="ts">
import { Button, Text } from "~/components/ui";
import { SafeAreaLayout } from "~/layouts";
import { RouterLink } from "vue-router";
import { useHomeController } from "./Home.controller";

const { title, isLoggedIn, user, goToSignIn, signOut } = useHomeController();
</script>

<template>
  <SafeAreaLayout>
    <div
      class="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <Text variant="h2">{{ title }}</Text>

      <template v-if="isLoggedIn">
        <Text variant="body1">Signed in as {{ user?.email }}.</Text>
        <Button variant="outlined" @click="signOut">
          <Text
            variant="button"
            class="text-base font-semibold text-current normal-case">
            Sign out
          </Text>
        </Button>
      </template>

      <template v-else>
        <Text variant="body1" color="warning">You are not logged in.</Text>
        <Button @click="goToSignIn">
          <Text
            variant="button"
            class="text-base font-semibold text-current normal-case">
            Back to Sign in
          </Text>
        </Button>
      </template>

      <RouterLink to="/stories" class="text-sm text-blue-500 underline">
        <Text
          variant="button"
          class="text-sm font-normal text-current normal-case">
          View Available Component
        </Text>
      </RouterLink>
    </div>
  </SafeAreaLayout>
</template>
