<template>
  <div class="keyboard">
    <div v-for="(row, i) in rows" :key="i" class="keyboard-row">
      <button
        v-for="key in row"
        :key="key"
        :class="['key', getKeyClass(key), { 'special-key': key === 'Enter' || key === 'Backspace' }]"
        @click="$emit('keyclick', key)"
      >
        {{ key === 'Backspace' ? '⌫' : key === 'Enter' ? '⏎' : key }}
      </button>
    </div>
  </div>
</template>

<script setup>
const rows = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Enter', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace']
];

const props = defineProps({
  keyStatuses: {
    type: Object,
    default: () => ({})
  }
});

defineEmits(['keyclick']);

const getKeyClass = (key) => {
  return props.keyStatuses[key.toUpperCase()] || '';
};
</script>

<style scoped>
.keyboard {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 0 10px;
  margin: 0 auto;
  max-width: 500px;
}

.keyboard-row {
  display: flex;
  justify-content: center;
  gap: 6px;
  touch-action: manipulation;
}

.key {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(5px);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 0;
  height: 58px;
  min-width: 32px;
  max-width: 44px;
  width: 100%;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.key.correct {
  background: linear-gradient(135deg, #538d4e 0%, #60a15a 100%);
  border-color: #538d4e;
  box-shadow: 0 4px 12px rgba(83, 141, 78, 0.2);
}

.key.present {
  background: linear-gradient(135deg, #b59f3b 0%, #c9b458 100%);
  border-color: #b59f3b;
  box-shadow: 0 4px 12px rgba(181, 159, 59, 0.2);
}

.key.absent {
  background: rgba(18, 18, 19, 0.8);
  border-color: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.2);
  opacity: 0.5;
  cursor: default;
}

.key:hover:not(.absent) {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.2);
}

.key:active {
  transform: scale(0.92);
}

.key.special-key {
  min-width: 58px;
  max-width: 75px;
  font-size: 1.2rem;
  background: rgba(255, 255, 255, 0.15);
}

@media (max-width: 480px) {
  .keyboard {
    gap: 6px;
    padding: 0 4px;
  }
  
  .keyboard-row {
    gap: 4px;
  }

  .key {
    height: 54px;
    min-width: 28px;
    font-size: 0.95rem;
  }

  .key.special-key {
    min-width: 48px;
    font-size: 1rem;
  }
}

@media (max-height: 700px) {
  .keyboard {
    gap: 4px;
  }
  .key {
    height: 48px;
    font-size: 0.9rem;
  }
  .key.special-key {
    height: 48px;
  }
}

@media (max-height: 600px) {
  .keyboard {
    gap: 3px;
  }
  .key {
    height: 40px;
    font-size: 0.85rem;
    border-radius: 4px;
  }
  .key.special-key {
    height: 40px;
  }
}
</style>
