<template>
  <button
    class="header-btn daily-game-btn"
    :class="{ active: isActive }"
    @click="$emit('click')"
    :title="isActive ? 'Playing Daily Game' : 'Play Daily Game'"
  >
    <span class="day-number">{{ dayOfMonth }}</span>
  </button>
</template>

<script setup>
defineProps({
  isActive: {
    type: Boolean,
    default: false,
  },
  dayOfMonth: {
    type: Number,
    default: () => new Date().getDate(),
  },
});

defineEmits(["click"]);
</script>

<style scoped>
.daily-game-btn {
  background: var(--surface-card-hover);
  border: 1px solid var(--border-default);
  color: var(--text-secondary);
  width: 44px;
  height: 44px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0;
  position: relative;
}

.daily-game-btn:hover {
  background: var(--surface-card-active);
  color: var(--text-strong);
  transform: scale(1.05);
}

.daily-game-btn:active {
  transform: scale(0.95);
}

/* Calendar-style inner border */
.daily-game-btn::before {
  content: "";
  position: absolute;
  top: 8px;
  left: 7px;
  right: 7px;
  bottom: 8px;
  border: 2px solid;
  border-color: var(--text-secondary);
  pointer-events: none;
}

.daily-game-btn:hover::before {
  border-color: var(--text-strong);
}

.daily-game-btn.active {
  background: var(--state-correct-gradient);
  border-color: var(--state-correct);
  color: var(--text-on-accent);
  box-shadow: 0 0 12px var(--state-correct-glow);
}

.daily-game-btn.active::before {
  border-color: var(--text-on-accent);
}

.daily-game-btn.active:hover {
  background: var(--state-correct-gradient-hover);
}

.day-number {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1;
  position: relative;
  z-index: 1;
}

@media (max-width: 480px) {
  .daily-game-btn {
    width: 38px;
    height: 38px;
  }

  .daily-game-btn::before {
    top: 6px;
    left: 6px;
    right: 6px;
    bottom: 6px;
  }

  .day-number {
    font-size: 0.9rem;
  }
}
</style>
