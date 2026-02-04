<template>
  <Transition :name="transitionName">
    <div v-if="show" :class="['base-toast', positionClass]" :style="toastStyle">
      <div class="toast-icon">
        <slot name="icon"></slot>
      </div>
      <div class="toast-text">
        <div class="toast-title">
          <slot name="title"></slot>
        </div>
        <div class="toast-message">
          <slot name="message"></slot>
        </div>
      </div>
      <div class="toast-actions">
        <slot name="actions"></slot>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  position: {
    type: String,
    default: "top-fixed", // 'top-fixed' or 'inline'
  },
  show: {
    type: Boolean,
    default: false,
  },
  glowColor: {
    type: String,
    default: "#538d4e", // Default to green
  },
});

const positionClass = computed(() => `toast-position-${props.position}`);

const transitionName = computed(() => {
  return props.position === "inline" ? "toast-pop-inline" : "toast-pop-fixed";
});

const toastStyle = computed(() => ({
  "--glow-color": props.glowColor,
}));
</script>

<style>
.base-toast {
  background: linear-gradient(#2a2a2b 0%, #1e1e1f 100%);
  border: 2px solid var(--glow-color);
  border-radius: 16px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 10px 40px rgba(from var(--glow-color) r g b / 0.3);
  z-index: 2000;
  min-width: 280px;
}

.toast-position-top-fixed {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
}

.toast-position-inline {
  margin: 0 auto; /* Centered horizontally in parent */
  position: relative;
  z-index: 1;
  width: fit-content;
}

.toast-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.toast-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-grow: 1;
}

.toast-title {
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
}

.toast-message {
  font-size: 0.9rem;
  color: #a0a0a0;
}

.toast-actions button {
  background: var(--glow-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-weight: bold;
  transition: opacity 0.2s;
}

.toast-actions button:hover {
  opacity: 0.8;
}

/* Inline Toast Animations */
.toast-pop-inline-enter-active {
  animation: toastIn-inline 0.4s ease-out;
}

.toast-pop-inline-leave-active {
  animation: toastOut-inline 0.3s ease-in;
}

@keyframes toastIn-inline {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes toastOut-inline {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.9);
  }
}

/* Fixed Toast Animations */
.toast-pop-fixed-enter-active {
  animation: toastIn-fixed 0.5s ease-out;
}

.toast-pop-fixed-leave-active {
  animation: toastOut-fixed 0.3s ease-in;
}

@keyframes toastIn-fixed {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px) scale(0.9);
  }
  50% {
    transform: translateX(-50%) translateY(5px) scale(1.05);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

@keyframes toastOut-fixed {
  from {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
}
</style>
