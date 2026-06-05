<template>
  <Transition :name="transitionName">
    <div v-if="show" :class="['base-toast', positionClass, variantClass]">
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
  variant: {
    type: String,
    default: "success",
    validator: (value) =>
      ["success", "info", "warning", "error"].includes(value),
  },
});

const positionClass = computed(() => `toast-position-${props.position}`);
const variantClass = computed(() => `base-toast-${props.variant}`);

const transitionName = computed(() => {
  return props.position === "inline" ? "toast-pop-inline" : "toast-pop-fixed";
});
</script>

<style>
.base-toast {
  --accent-glow-color: var(--state-correct);

  background: var(--surface-toast-gradient);
  border: 2px solid var(--accent-glow-color);
  border-radius: 16px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: var(--shadow-glow-soft);
  z-index: 2000;
  min-width: 280px;
}

.base-toast-success {
  --accent-glow-color: var(--state-correct);
}

.base-toast-info {
  --accent-glow-color: var(--feedback-info);
}

.base-toast-warning {
  --accent-glow-color: var(--feedback-warning);
}

.base-toast-error {
  --accent-glow-color: var(--feedback-error);
}

.toast-position-top-fixed {
  /* Positioning is handled by the parent .toast-stack container so that
     multiple simultaneous toasts stack vertically instead of overlapping. */
  position: relative;
  pointer-events: auto;
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
  color: var(--text-strong);
}

.toast-message {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.toast-actions button {
  background: var(--accent-glow-color);
  color: var(--text-on-accent);
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
    transform: translateY(-20px) scale(0.9);
  }
  50% {
    transform: translateY(5px) scale(1.05);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes toastOut-fixed {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-20px);
  }
}
</style>
