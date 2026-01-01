// todo: expose method for visualizing virtual button press when physical key is pressed

<template>
  <div class="keyboard">
    <div v-for="(row, i) in rows" :key="i" class="keyboard-row">
      <button
        v-for="key in row"
        :id="key"
        :key="key"
        :class="['key', getKeyClass(key), { 'backspace-key':key === 'Backspace' }, { 'enter-key': key === 'Enter' }]"
        :disabled="isKeyDisabled(key)"
        @click="handleKeyClick(key)"
      >
        {{ key === 'Backspace' ? '⌫' : key === 'Enter' ? 'Submit' : key }}
      </button>
    </div>
  </div>
</template>

<script setup>
const rows = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace'],
  ['Enter']
];

const props = defineProps({
  keyStatuses: {
    type: Object,
    default: () => ({})
  },
  hardMode: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['keyclick']);

const getKeyClass = (key) => {
  return props.keyStatuses[key.toUpperCase()] || '';
};

const isKeyDisabled = (key) => {
  if (!props.hardMode) return false;
  if (key === 'Enter' || key === 'Backspace') return false;
  return props.keyStatuses[key.toUpperCase()] === 'absent';
};

const handleKeyClick = (key) => {
  if (isKeyDisabled(key)) return;
  emit('keyclick', key);
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
  max-width: 600px;
}

.keyboard-row {
  display: flex;
  justify-content: center;
  gap: 6px;
  touch-action: manipulation;
}

.key {
  background: linear-gradient(rgba(77, 77, 77, 1), rgba(38, 38, 38, 1));
  backdrop-filter: blur(5px);
  color: white;
  border: 0px solid #0000;
  border-radius: 6px;
  padding: 0;
  height: 58px;
  min-width: 32px;
  max-width: 54px;
  width: 100%;
  font-weight: 700;
  font-size: 2rem;
  cursor: pointer;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.key:focus {
  outline: none;
}

.key:hover:not(.absent) {
  background: linear-gradient(rgba(77, 77, 77, .8), rgba(38, 38, 38, .8));
}

.key.correct {
  background: linear-gradient(rgba(110, 169, 94, 1), rgba(83, 125, 78, 1));
}

.key.correct:hover {
  background: linear-gradient(rgba(104, 161, 90, 0.8), rgba(83, 125, 78, 0.8));
}

.key.present {
  background: linear-gradient(rgb(217, 206, 85), rgb(128, 124, 3));
}
.key.present:hover {
  background: linear-gradient(rgba(217, 206, 85, 0.8), rgba(128, 124, 3, 0.8));
}

.key.absent {
  background: transparent;
  color: rgba(255, 255, 255, 0.2);
  opacity: 0.5;
  cursor: default;
}

.key.backspace-key {
  min-width: 58px;
  max-width: 75px;
  font-size: 2rem;
  background: linear-gradient(rgba(156, 32, 32, 1), rgba(105, 18, 18, 1));
}

.key.backspace-key:hover {
  background: linear-gradient(rgba(156, 32, 32, 0.8), rgba(105, 18, 18, 0.8));
}

.key.enter-key {
  min-width: 200px;
  max-width: 300px;
  background: linear-gradient(rgba(110, 169, 94, 1), rgba(83, 125, 78, 1));
}

.key.enter-key:hover {
  background: linear-gradient(rgba(110, 169, 94, .8), rgba(83, 125, 78, .8));
}

.key:active, .key.active {
  filter: brightness(0.9);
  position: relative;
  top: 1px;
}

@media (max-width: 375px) {
  .keyboard {
    gap: 6px;
    padding: 0 4px;
  }

  .key {
    min-width: 28px;
    font-size: 1.8rem;
  }

  .key.backspace-key {
    min-width: 48px;
    font-size: 1.8rem;
  }
}

@media (max-height: 630px) {
  .keyboard {
    gap: 4px;
  }
  .key {
    height: 48px;
    font-size: 0.9rem;
  }
  .key.backspace-key {
    height: 48px;
  }
}

@media (max-height: 605px) {
  .keyboard {
    gap: 3px;
  }
  .key {
    height: 40px;
    font-size: 0.85rem;
    border-radius: 4px;
  }
  .key.backspace-key {
    height: 40px;
  }
}
</style>
