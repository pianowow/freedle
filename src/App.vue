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
      <Keyboard :key-statuses="keyStatuses" @keyclick="handleKeyClick" />
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

// Function to get a random word
const getRandomWord = (length) => {
  const words = WORDS[length];
  return words[Math.floor(Math.random() * words.length)].toUpperCase();
};

const targetWord = ref(getRandomWord(wordLength.value));

const keyStatuses = computed(() => {
  const statuses = {};
  for (let i = 0; i < currentRow.value; i++) {
    const guess = guesses.value[i].toUpperCase();
    const target = targetWord.value.toUpperCase();

    for (let j = 0; j < guess.length; j++) {
      const letter = guess[j];
      const currentStatus = statuses[letter];

      if (letter === target[j]) {
        statuses[letter] = 'correct';
      } else if (target.includes(letter)) {
        if (currentStatus !== 'correct') {
          statuses[letter] = 'present';
        }
      } else {
        if (currentStatus !== 'correct' && currentStatus !== 'present') {
          statuses[letter] = 'absent';
        }
      }
    }
  }
  return statuses;
});

const gridStyle = computed(() => ({
  '--cols': wordLength.value
}));

const getLetter = (rowIndex, colIndex) => {
  return guesses.value[rowIndex][colIndex] || '';
};

const getTileColor = (rowIndex, colIndex) => {
  if (rowIndex >= currentRow.value) return 'idle';
  
  const guess = guesses.value[rowIndex].toUpperCase();
  const target = targetWord.value.toUpperCase();
  const letter = guess[colIndex];

  // 1. Correct position
  if (letter === target[colIndex]) {
    return 'correct';
  }

  // 2. Present/Absent logic with count handling
  // Count how many of this letter are in the target word
  let targetCount = 0;
  for (let i = 0; i < target.length; i++) {
    if (target[i] === letter) targetCount++;
  }

  // Count how many 'correct' instances of this letter we have
  let correctCount = 0;
  for (let i = 0; i < target.length; i++) {
    if (guess[i] === letter && guess[i] === target[i]) correctCount++;
  }

  // Count how many 'present' (yellow) instances of this letter BEFORE this index
  let presentBeforeCount = 0;
  for (let i = 0; i < colIndex; i++) {
    // Only count as 'present' if it's not 'correct' at that position
    if (guess[i] === letter && guess[i] !== target[i]) {
      presentBeforeCount++;
    }
  }

  // If (correctCount + presentBeforeCount) < targetCount, this one can be yellow
  if (target.includes(letter) && (correctCount + presentBeforeCount) < targetCount) {
    return 'present';
  }

  return 'absent';
};

const handleKeyClick = (key) => {
  const currentGuess = guesses.value[currentRow.value];
  
  if (key === 'Backspace') {
    guesses.value[currentRow.value] = currentGuess.slice(0, -1);
  } else if (key === 'Enter') {
    if (currentGuess.length === wordLength.value) {
      // Evaluate guess
      if (currentGuess.toUpperCase() === targetWord.value) {
        alert('You won!');
      } else if (currentRow.value === 5) {
        alert(`Game Over! The word was ${targetWord.value}`);
      }
      currentRow.value++;
    } else {
      alert('Word too short');
    }
  } else if (currentGuess.length < wordLength.value) {
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
