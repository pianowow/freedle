<template>
  <BaseToast :show="show" glow-color="#538d4e">
    <template #icon>{{ achievement.icon }}</template>
    <template #title>Achievement Unlocked!</template>
    <template #message>{{ achievement.name }}</template>
  </BaseToast>
</template>

<script setup>
import BaseToast from "./BaseToast.vue";

defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  achievement: {
    type: Object,
    required: true,
    default: () => ({ icon: '🏆', name: '' }),
  },
});
</script>