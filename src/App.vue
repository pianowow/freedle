<template>
  <div id="app-container">
    <header>
      <div class="header-content">
        <h1>Freeordle</h1>
        <div class="difficulty-selector">
          <button 
            v-for="len in [4, 5, 6]" 
            :key="len" 
            :class="{ active: wordLength === len }"
            @click="setWordLength(len)"
          >
            {{ len }}
          </button>
        </div>
      </div>
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

    <div class="game-status-area">
      <div v-if="gameState !== 'playing'" class="status-content">
        <h2 v-if="gameState === 'won'">Excellent! 🌟</h2>
        <h2 v-else>Game Over</h2>
        <p v-if="gameState === 'lost'">The word was: <strong>{{ targetWord }}</strong></p>
        <button @click="resetGame" class="new-game-btn">New Game</button>
      </div>
    </div>

    <footer>
      <Keyboard :key-statuses="keyStatuses" @keyclick="handleKeyClick" />
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import LetterTile from './components/LetterTile.vue';
import Keyboard from './components/Keyboard.vue';
import { WORDS } from './data/words';

const wordLength = ref(5);
const guesses = ref(['', '', '', '', '', '']);
const currentRow = ref(0);
const targetWord = ref('');
const gameState = ref('playing'); // 'playing', 'won', 'lost'

// Function to get a random word
const getRandomWord = (length) => {
  const words = WORDS[length];
  return words[Math.floor(Math.random() * words.length)].toUpperCase();
};

const resetGame = () => {
  guesses.value = ['', '', '', '', '', ''];
  currentRow.value = 0;
  gameState.value = 'playing';
  targetWord.value = getRandomWord(wordLength.value);
};

// Initialize game
targetWord.value = getRandomWord(wordLength.value);

const setWordLength = (len) => {
  if (currentRow.value > 0 && !confirm('Change word length and restart game?')) {
    return;
  }
  wordLength.value = len;
  resetGame();
};

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
  if (gameState.value !== 'playing') return;
  
  const currentGuess = guesses.value[currentRow.value];
  
  if (key === 'Backspace') {
    guesses.value[currentRow.value] = currentGuess.slice(0, -1);
  } else if (key === 'Enter') {
    if (currentGuess.length === wordLength.value) {
      // Evaluate guess
      if (currentGuess.toUpperCase() === targetWord.value) {
        gameState.value = 'won';
      } else if (currentRow.value === 5) {
        gameState.value = 'lost';
      }
      currentRow.value++;
    }
  } else if (currentGuess.length < wordLength.value) {
    if (/^[A-Z]$/i.test(key)) {
      guesses.value[currentRow.value] += key.toUpperCase();
    }
  }
};

const handlePhysicalKeyDown = (event) => {
  if (gameState.value !== 'playing') return;

  const key = event.key;
  if (key === 'Backspace' || key === 'Enter') {
    handleKeyClick(key);
  } else if (/^[a-zA-Z]$/.test(key)) {
    handleKeyClick(key.toUpperCase());
  }
};

onMounted(() => {
  window.addEventListener('keydown', handlePhysicalKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handlePhysicalKeyDown);
});
</script>

<style>
#app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}

header {
  height: auto;
  min-height: 50px;
  padding: 10px;
}

.header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
}

@media (min-width: 600px) {
  .header-content {
    flex-direction: row;
    justify-content: space-between;
    max-width: 500px;
    margin: 0 auto;
  }
}

.difficulty-selector {
  display: flex;
  gap: 8px;
}

.difficulty-selector button {
  background: #3a3a3c;
  border: 1px solid #565758;
  color: white;
  padding: 5px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.difficulty-selector button.active {
  background: #538d4e;
  border-color: #538d4e;
}

.difficulty-selector button:hover:not(.active) {
  background: #4a4a4c;
}

main {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
}

.game-status-area {
  height: 110px; /* Fixed height to prevent layout jumping */
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.status-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.status-content h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #538d4e;
}

.status-content p {
  margin: 0;
  font-size: 1rem;
}

.new-game-btn {
  background: #538d4e;
  color: white;
  border: none;
  padding: 8px 20px;
  font-size: 0.9rem;
  font-weight: bold;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.new-game-btn:hover {
  background: #60a15a;
  transform: translateY(-1px);
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
