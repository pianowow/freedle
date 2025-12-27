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
  padding: 0 8px;
  margin: 0 auto;
}

.keyboard-row {
  display: flex;
  justify-content: center;
  gap: 6px;
  touch-action: manipulation;
}

.key {
  background-color: #818384;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0;
  height: 58px;
  min-width: 32px;
  max-width: 44px;
  width: 100%;
  font-weight: bold;
  font-size: 2em;
  cursor: pointer;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  user-select: none;
}

.key.correct {
  background-color: #538d4e;
}

.key.present {
  background-color: #b59f3b;
}

.key.absent {
  background-color: #3a3a3c;
}

.key:hover {
  filter: brightness(1.2);
}

.key:active {
  transform: scale(0.95);
}

.key.special-key {
  min-width: 52px;
  max-width: 65px;
  font-size: 2em;
  background-color: #565f7c;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
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
    height: 52px;
    min-width: 28px;
    font-size: 0.85rem;
  }

}
</style>
