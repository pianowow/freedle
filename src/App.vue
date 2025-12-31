<template>
  <div id="app-container">
    <header>
      <div class="header-content">
        <h1>
          <img src="/apple-touch-icon.png" alt="F" class="title-icon" />
          reedle
        </h1>
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
          <div :class="['row', { 'shake': shakingRow === rowIndex } ]">
            <LetterTile
              v-for="(col, colIndex) in wordLength"
              :key="colIndex"
              :letter="getLetter(rowIndex, colIndex)"
              :color="getTileColor(rowIndex, colIndex)"
              :delay="getTileDelay(rowIndex, colIndex)"
              :class="{ 'winner': gameState === 'won' && rowIndex === currentRow - 1 && showWinAnimation }"
            />
          </div>
        </template>
      </div>
    </main>

    <div v-if="gameState === 'playing'" class="game-status-area">
      <ReloadPWA />
      <Transition name="fade">
        <div v-if="message" class="message-content">
          <p>{{ message }}</p>
        </div>
      </Transition>
    </div>

    <footer :class="{ 'is-endgame': gameState !== 'playing' }">
      <Keyboard v-if="gameState === 'playing'" :key-statuses="keyStatuses" @keyclick="handleKeyClick" />
      <div v-else class="endgame-container">
        <div class="status-content">
          <h2 v-if="gameState === 'won'">Excellent! 🌟</h2>
          <h2 v-else>Game Over</h2>
          <p v-if="gameState === 'lost'" class="revealed-word">The word was: <strong>{{ targetWord }}</strong></p>
            
          <div v-if="targetMeanings && targetMeanings.length > 0" class="meanings-container">
            <div v-for="(m, idx) in targetMeanings" :key="idx" class="meaning-item">
              <div class="meaning-header">
                 <span v-if="m.speech_part" class="speech-part">{{ m.speech_part }}</span>
                 <p class="definition">{{ m.def }}</p>
              </div>
              <p v-if="m.example" class="example">"{{ m.example }}"</p>
              <div v-if="m.synonyms && m.synonyms.length > 0" class="synonyms">
                <span class="syn-label">Synonyms:</span> {{ m.synonyms.join(', ') }}
              </div>
            </div>
          </div>
          
          <button @click="resetGame" class="new-game-btn">New Game</button>
        </div>
      </div>
    </footer>
    <div v-if="isLoading" class="loading-overlay">
      <div class="loader"></div>
      <p>Loading Dictionary...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import LetterTile from './components/LetterTile.vue';
import Keyboard from './components/Keyboard.vue';
import ReloadPWA from './components/ReloadPWA.vue';

const wordLength = ref(5);
const isLoading = ref(true);
const dictionary = ref({});
const allowedGuesses = ref({ 4: [], 5: [], 6: [] });
const answerWords = ref({ 4: [], 5: [], 6: [] });
const guesses = ref(['', '', '', '', '', '']);
const currentRow = ref(0);
const targetWord = ref('');
const targetMeanings = ref([]);
const gameState = ref('playing'); // 'playing', 'won', 'lost'
const message = ref('');
const shakingRow = ref(-1);
const showWinAnimation = ref(false);
const keyStatuses = ref({});

// Function to get a random word
const getRandomWord = (length) => {
  const words = answerWords.value[length];
  
  // Fallback to dictionary words if no answers
  let activeWords = (words && words.length > 0) ? words : allowedGuesses.value[length];
  
  if (!activeWords || activeWords.length === 0) return null;
  
  const selectedWord = activeWords[Math.floor(Math.random() * activeWords.length)];
  const wordData = dictionary.value[selectedWord.toLowerCase()];
  
  return {
    word: selectedWord,
    meanings: wordData ? wordData.meanings : []
  };
};

const resetGame = () => {
  guesses.value = ['', '', '', '', '', ''];
  currentRow.value = 0;
  gameState.value = 'playing';
  message.value = '';
  shakingRow.value = -1;
  showWinAnimation.value = false;
  keyStatuses.value = {};
  const selected = getRandomWord(wordLength.value);
  if (selected) {
    targetWord.value = selected.word;
    targetMeanings.value = selected.meanings;
    
    // Debug info in dev mode
    if (import.meta.env.DEV) {
      console.log(`[DEV] Target Word: ${targetWord.value}`);
    }
  }
};

// Initial state
targetWord.value = '';
targetMeanings.value = [];

const fetchDictionary = async () => {
  try {
    isLoading.value = true;
    
    // Fetch dictionary (common words with definitions) and allowed guesses
    const [dictRes, allowedRes] = await Promise.all([
      fetch('data/target-dictionary.json'),
      fetch('data/allowed-guesses.txt')
    ]);
    
    const dictData = await dictRes.json();
    const allowedText = await allowedRes.text();
    
    const valid = { 4: [], 5: [], 6: [] };
    const answers = { 4: [], 5: [], 6: [] };
    
    // Populate valid guesses from allowed-guesses.txt
    allowedText.split('\n').forEach(line => {
      const word = line.trim().toUpperCase();
      if (word && word.length >= 4 && word.length <= 6) {
        valid[word.length].push(word);
      }
    });

    // Populate target answers from target-dictionary.json
    Object.keys(dictData).forEach(word => {
      const len = word.length;
      if (answers[len]) {
        answers[len].push(word.toUpperCase());
      }
    });
    
    dictionary.value = dictData;
    allowedGuesses.value = valid;
    answerWords.value = answers;
  } catch (error) {
    console.error('Failed to load dictionary:', error);
  } finally {
    isLoading.value = false;
    resetGame();
  }
};

const setWordLength = (len) => {
  if (currentRow.value > 0 && gameState.value === 'playing' && !confirm('Change word length and restart game?')) {
    return;
  }
  wordLength.value = len;
  resetGame();
};

const updateKeyStatuses = (guess) => {
  const target = targetWord.value.toUpperCase();
  const newStatuses = { ...keyStatuses.value };

  guess.split('').forEach((letter, j) => {
    const currentStatus = newStatuses[letter];

    if (letter === target[j]) {
      newStatuses[letter] = 'correct';
    } else if (target.includes(letter)) {
      if (currentStatus !== 'correct') {
        newStatuses[letter] = 'present';
      }
    } else {
      if (currentStatus !== 'correct' && currentStatus !== 'present') {
        newStatuses[letter] = 'absent';
      }
    }
  });

  // Update the keyboard all at once after the first tile begins to flip
  setTimeout(() => {
    keyStatuses.value = newStatuses;
  }, 400);
};

const gridStyle = computed(() => ({
  '--cols': wordLength.value
}));

const getLetter = (rowIndex, colIndex) => {
  return guesses.value[rowIndex][colIndex] || '';
};

const getTileDelay = (rowIndex, colIndex) => {
  if (rowIndex === currentRow.value - 1) {
    return `${colIndex * 150}ms`;
  }
  return '0ms';
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
        // Validate guess against full dictionary (if not in test mode)
        const guessUpper = currentGuess.toUpperCase();
        const isValid = allowedGuesses.value[wordLength.value].includes(guessUpper);
        
        if (!isValid) {
          message.value = 'Not in word list';
          shakingRow.value = currentRow.value;
          setTimeout(() => {
            if (message.value === 'Not in word list') message.value = '';
            shakingRow.value = -1;
          }, 600);
          return;
        }

      // Update keyboard statuses after flips
      updateKeyStatuses(guessUpper);

      // Evaluate guess
      if (guessUpper === targetWord.value) {
        currentRow.value++;
        // Delay the win message and animation until flips are done
        setTimeout(() => {
          gameState.value = 'won';
          showWinAnimation.value = true;
        }, wordLength.value * 150 + 400);
      } else if (currentRow.value === 5) {
        currentRow.value++;
        setTimeout(() => {
          gameState.value = 'lost';
        }, wordLength.value * 150 + 400);
      } else {
        currentRow.value++;
      }
      message.value = '';
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
  fetchDictionary();
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
  height: 100dvh;
  width: 100%;
  overflow: hidden;
}

header {
  height: auto;
  min-height: 60px;
  padding: 8px 15px;
  background: rgba(18, 18, 19, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 100;
}

.header-content {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.title-icon {
  width: 2.5rem;
  height: 2.5rem;
  display: inline-block;
  vertical-align: middle;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.header-content h1 {
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.15rem;
  background: linear-gradient(to bottom, #ffffff 0%, #a0a0a0 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 2rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.difficulty-selector {
  display: flex;
  gap: 8px;
}

.difficulty-selector button {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #a0a0a0;
  padding: 6px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.9rem;
}

.difficulty-selector button.active {
  background: linear-gradient(135deg, #538d4e 0%, #60a15a 100%);
  border-color: #538d4e;
  color: white;
  box-shadow: 0 4px 15px rgba(83, 141, 78, 0.3);
  transform: scale(1.05);
}

@media (max-width: 480px) {
  .difficulty-selector button {
    padding: 4px 10px;
    font-size: 0.85rem;
  }
}

main {
  margin: 10px;
  display: flex;
  align-items: flex-start; /* Keep at top so it doesn't move */
  justify-content: center;
  padding: 0 5px; /* Removed vertical padding */
  overflow: hidden;
}

.game-status-area {
  flex-grow: 1;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0 10px;
}

.status-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  width: 100%;
  height: 100%;
}

.status-content h2 {
  margin: 0;
  font-size: 1.6rem;
  color: #538d4e;
  flex-shrink: 0;
}

.status-content p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.4;
  max-width: 400px;
}

.message-content {
  background: #ffffff;
  color: #121213;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 800;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05rem;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

.word-definition {
  color: #818384;
  font-style: italic;
  margin-bottom: 5px !important;
}

.endgame-container {
  flex: 1;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 0;
  animation: slideUp 0.4s ease-out;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  min-height: 0;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.meanings-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  min-height: 0;
  overflow-y: auto;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  margin: 4px 0;
  text-align: left;
  border: 1px solid rgba(255, 255, 255, 0.1);
  scrollbar-width: thin;
  scrollbar-color: #538d4e transparent;
}

.meanings-container::-webkit-scrollbar {
  width: 6px;
}

.meanings-container::-webkit-scrollbar-thumb {
  background-color: #538d4e;
  border-radius: 10px;
}

.meaning-item {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 8px;
}

.meaning-item:last-child {
  border-bottom: none;
}

.meaning-header {
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.speech-part {
  background: #538d4e;
  height: 25px;
  color: white;
  font-size: 0.9rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.definition {
  margin: 4px 4px;
  font-size: 1.3rem;
  color: #ffffff;
}

.example {
  margin: 4px 0 !important;
  font-size: 1rem;
  color: #a0a0a0;
  font-style: italic;
}

.synonyms {
  margin-top: 4px;
  font-size: 1rem;
  color: #818384;
}

.syn-label {
  font-weight: bold;
  color: #538d4e;
}

.new-game-btn {
  background: #538d4e;
  color: white;
  border: none;
  padding: 10px 24px;
  font-size: 1.5rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin: 4px 0 8px 0;
  flex-shrink: 0;
  width: 100%;
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

.row.shake {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

footer {
  padding: 0 10px 8px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 180px; 
  flex-shrink: 0;
}

footer.is-endgame {
  flex: 1;
  min-height: 200px;
  max-height: 65%; /* Increased to give more room */
}



.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(18, 18, 19, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loader {
  border: 4px solid #3a3a3c;
  border-top: 4px solid #538d4e;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

</style>
