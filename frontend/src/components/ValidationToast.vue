<template>
  <BaseToast :show="show" variant="error" position="top-fixed">
    <template #icon>🚫</template>
    <template #title>Invalid Guess</template>
    <template #message>{{ message }}</template>
  </BaseToast>
</template>

<script setup>
import BaseToast from "./BaseToast.vue";

defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    required: true,
  },
});
</script>
