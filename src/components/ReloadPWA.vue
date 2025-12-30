<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue'

const {
  offlineReady,
  needRefresh,
  updateServiceWorker,
} = useRegisterSW()
</script>

<template>
  <div
    v-if="needRefresh"
    class="pwa-toast"
    role="alert"
  >
    <div class="message">
      New version available!
    </div>
    <button @click="updateServiceWorker()">
      Reload
    </button>
  </div>
</template>

<style>
.pwa-toast {
  border: 2px solid #3a3a3c;
  border-radius: 4px;
  z-index: 1;
  text-align: left;
  padding: 10px;
}
.pwa-toast .message {
  margin-bottom: 8px;
}

.pwa-toast button {
  border: 1px solid #3a3a3c;
  outline: none;
  margin-right: 5px;
  border-radius: 2px;
  padding: 3px 10px;
  cursor: pointer;
}
</style>
