<template>
  <div class="keyboard">
    <div v-for="(row, i) in rows" :key="i" class="keyboard-row">
      <button
        v-for="key in row"
        :id="key"
        :key="key"
        :class="[
          'key',
          getKeyClass(key),
          { 'backspace-key': key === 'Backspace' },
          { 'enter-key': key === 'Enter' },
        ]"
        :disabled="isKeyDisabled(key)"
        @click="handleKeyClick(key)"
      >
        {{ key === "Backspace" ? "⌫" : key === "Enter" ? "Submit" : key }}
      </button>
    </div>
  </div>
</template>

<script setup>
const rows = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M", "Backspace"],
  ["Enter"],
];

const props = defineProps({
  keyStatuses: {
    type: Object,
    default: () => ({}),
  },
  hardMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["keyclick"]);

const getKeyClass = (key) => {
  return props.keyStatuses[key.toUpperCase()] || "";
};

const isKeyDisabled = (key) => {
  if (!props.hardMode) return false;
  if (key === "Enter" || key === "Backspace") return false;
  return props.keyStatuses[key.toUpperCase()] === "absent";
};

const handleKeyClick = (key) => {
  if (isKeyDisabled(key)) return;
  emit("keyclick", key);
};
</script>

<style scoped>
.keyboard {
  display: flex;
  flex-direction: column;
  /* Use the shared keyboard geometry variables so the endgame footer
     (App.vue) can reserve an identical height. Falls back to literals. */
  gap: var(--keyboard-row-gap, 8px);
  width: 100%;
  margin: 0 auto;
  max-width: 720px;
}

.keyboard-row {
  display: flex;
  justify-content: center;
  gap: 6px;
  touch-action: manipulation;
}

.key {
  background: var(--state-absent-gradient);
  backdrop-filter: blur(5px);
  color: var(--text-on-accent);
  border: 0 solid transparent;
  border-radius: 6px;
  padding: 0;
  height: var(--keyboard-key-height, 66px);
  min-width: 32px;
  max-width: 64px;
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
  -webkit-tap-highlight-color: transparent;
}

.key:focus {
  outline: none;
}

@media (hover: hover) {
  .key:hover:not(.absent) {
    background: var(--state-absent-gradient-hover);
  }

  .key.correct:hover {
    background: var(--state-correct-gradient-hover);
  }

  .key.present:hover {
    background: var(--state-present-gradient-hover);
  }

  .key.backspace-key:hover {
    background: var(--action-destructive-gradient-hover);
  }

  .key.enter-key:hover {
    background: var(--state-correct-gradient-hover);
  }
}

.key.correct {
  background: var(--state-correct-gradient);
}

.key.present {
  background: var(--state-present-gradient);
}

.key.absent {
  background: transparent;
  color: var(--text-disabled);
  opacity: 0.5;
  cursor: default;
}

.key.backspace-key {
  min-width: 58px;
  max-width: 88px;
  font-size: 2rem;
  background: var(--action-destructive-gradient);
}

.key.enter-key {
  min-width: 200px;
  max-width: 360px;
  background: var(--state-correct-gradient);
}

.key:active,
.key.active {
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

@media (max-height: 655px) {
  /* gap/height come from the shared variables overridden in App.vue */
  .key {
    font-size: 1.5rem;
  }
}

@media (max-height: 605px) {
  .key {
    font-size: 0.85rem;
    border-radius: 4px;
  }
}
</style>
