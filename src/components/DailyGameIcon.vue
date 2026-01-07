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
import { computed } from "vue";

defineProps({
  isActive: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["click"]);

const dayOfMonth = computed(() => {
  return new Date().getDate();
});
</script>

<style scoped>
.daily-game-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  background: rgba(255, 255, 255, 0.1);
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
  border-color: #888;
  pointer-events: none;
}

.daily-game-btn:hover::before {
  border-color: #fff;
}

.daily-game-btn.active {
  background: linear-gradient(135deg, #538d4e 0%, #3a6b35 100%);
  border-color: #538d4e;
  color: #fff;
  box-shadow: 0 0 12px rgba(83, 141, 78, 0.4);
}

.daily-game-btn.active::before {
  border-color: #fff;
}

.daily-game-btn.active:hover {
  background: linear-gradient(135deg, #5fa058 0%, #437d3d 100%);
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
