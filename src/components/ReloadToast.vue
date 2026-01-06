<template>
  <BaseToast :show="show" glow-color="#446cc9" position="inline">
    <template #icon>🔄</template>
    <template #title>New Version Available!</template>
    <template #message>Click to reload.</template>
    <template #actions>
      <button @click="$emit('reload')">Reload</button>
    </template>
  </BaseToast>
</template>

<script setup>
import BaseToast from "./BaseToast.vue";

defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["reload"]);
</script>
