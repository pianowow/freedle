<template>
  <div class="keyboard">
    <div v-for="(row, i) in rows" :key="i" class="keyboard-row">
      <button
        v-for="key in row"
        :key="key"
        :class="['key', getKeyClass(key)]"
        @click="$emit('keyclick', key)"
      >
        {{ key === 'Backspace' ? '⌫' : key }}
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
  max-width: 500px;
  margin: 20px auto;
}

.keyboard-row {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.key {
  background-color: #818384;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 15px 10px;
  font-weight: bold;
  cursor: pointer;
  text-transform: uppercase;
  min-width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  transition: background-color 0.2s;
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

.key[class*="Enter"], .key[class*="Backspace"] {
  flex: 1.5;
  font-size: 0.8rem;
}

@media (max-width: 480px) {
  .key {
    padding: 12px 6px;
    font-size: 0.9rem;
  }
}
</style>
