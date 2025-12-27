<template>
  <div id="app-container">
    <header>
      <h1>Freeordle</h1>
    </header>

    <main>
      <div class="game-grid" :style="gridStyle">
        <template v-for="(row, rowIndex) in 6" :key="rowIndex">
          <div class="row">
            <LetterTile
              v-for="(col, colIndex) in wordLength"
              :key="colIndex"
              :letter="getLetter(rowIndex, colIndex)"
              :color="getTileColor(rowIndex, colIndex)"
            />
          </div>
        </template>
      </div>
    </main>

    <footer>
      <Keyboard @keyclick="handleKeyClick" />
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import LetterTile from './components/LetterTile.vue';
import Keyboard from './components/Keyboard.vue';
import { WORDS } from './data/words';

const wordLength = ref(5);
const guesses = ref(['', '', '', '', '', '']);
const currentRow = ref(0);
const targetWord = ref(WORDS[5][0]); // Default to first 5-letter word for now

const gridStyle = computed(() => ({
  '--cols': wordLength.value
}));

const getLetter = (rowIndex, colIndex) => {
  return guesses.value[rowIndex][colIndex] || '';
};

const getTileColor = (rowIndex, colIndex) => {
  // Placeholder logic for now
  if (rowIndex >= currentRow.value) return 'idle';
  return 'absent'; // Will implement actual logic later
};

const handleKeyClick = (key) => {
  if (key === 'Backspace') {
    guesses.value[currentRow.value] = guesses.value[currentRow.value].slice(0, -1);
  } else if (key === 'Enter') {
    if (guesses.value[currentRow.value].length === wordLength.value) {
      currentRow.value++;
    }
  } else if (guesses.value[currentRow.value].length < wordLength.value) {
    if (/^[A-Z]$/i.test(key)) {
      guesses.value[currentRow.value] += key.toUpperCase();
    }
  }
};
</script>

<style>
#app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}

header {
  height: 50px;
  border-bottom: 1px solid #3a3a3c;
  display: flex;
  align-items: center;
  justify-content: center;
}

main {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.game-grid {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.row {
  display: flex;
  gap: 5px;
}

footer {
  padding: 10px;
}

h1 {
  font-size: 1.5rem;
  letter-spacing: 0.1rem;
}
</style>
