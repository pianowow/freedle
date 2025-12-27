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

    <div v-if="gameState === 'playing'" class="game-status-area">
      <Transition name="fade">
        <div v-if="message" class="message-content">
          <p>{{ message }}</p>
        </div>
      </Transition>
    </div>

    <footer v-if="gameState === 'playing'">
      <Keyboard :key-statuses="keyStatuses" @keyclick="handleKeyClick" />      
    </footer>
    <div v-else class="endgame-container">
      <div class="status-content">
        <h2 v-if="gameState === 'won'">Excellent! 🌟</h2>
        <h2 v-else>Game Over</h2>
        <p v-if="gameState === 'lost'" class="revealed-word">The word was: <strong>{{ targetWord }}</strong></p>
          
          <div v-if="targetMeanings && targetMeanings.length > 0" class="meanings-container">
            <div v-for="(m, idx) in targetMeanings" :key="idx" class="meaning-item">
              <div class="meaning-header">
                <span v-if="m.speech_part" class="speech-part">{{ m.speech_part }}</span>
              </div>
              <p class="definition">{{ m.def }}</p>
              <p v-if="m.example" class="example">"{{ m.example }}"</p>
              <div v-if="m.synonyms && m.synonyms.length > 0" class="synonyms">
                <span class="syn-label">Synonyms:</span> {{ m.synonyms.join(', ') }}
              </div>
            </div>
          </div>
          
          <button @click="resetGame" class="new-game-btn">New Game</button>
        </div>
      </div>
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

const wordLength = ref(5);
const isLoading = ref(true);
const dictionary = ref({});
const dictionaryWords = ref({ 4: [], 5: [], 6: [] });
const answerWords = ref({ 4: [], 5: [], 6: [] });
const guesses = ref(['', '', '', '', '', '']);
const currentRow = ref(0);
const targetWord = ref('');
const targetMeanings = ref([]);
const gameState = ref('playing'); // 'playing', 'won', 'lost'
const message = ref('');

// Function to get a random word
const getRandomWord = (length) => {
  const words = answerWords.value[length];
  
  // Fallback to dictionary words if no answers
  let activeWords = (words && words.length > 0) ? words : dictionaryWords.value[length];
  
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
    
    // Fetch dictionary (common words with definitions) and allowed words (all valid guesses)
    const [dictRes, allowedRes] = await Promise.all([
      fetch('/data/dictionary.json'),
      fetch('/data/allowed-words.txt')
    ]);
    
    const dictData = await dictRes.json();
    const allowedText = await allowedRes.text();
    
    const valid = { 4: [], 5: [], 6: [] };
    const answers = { 4: [], 5: [], 6: [] };
    
    // Populate valid guesses from allowed-words.txt
    allowedText.split('\n').forEach(line => {
      const word = line.trim().toLowerCase();
      if (word && word.length >= 4 && word.length <= 6) {
        valid[word.length].push(word.toUpperCase());
      }
    });

    // Populate target answers from dictionary.json (which we filtered to common words)
    Object.keys(dictData).forEach(word => {
      const len = word.length;
      if (answers[len]) {
        answers[len].push(word.toUpperCase());
      }
    });
    
    dictionary.value = dictData;
    dictionaryWords.value = valid;
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
        // Validate guess against full dictionary (if not in test mode)
        const guessUpper = currentGuess.toUpperCase();
        const isValid = dictionaryWords.value[wordLength.value].includes(guessUpper);
        
        if (!isValid) {
          message.value = 'Not in word list';
          setTimeout(() => {
            if (message.value === 'Not in word list') message.value = '';
          }, 2000);
          return;
        }

      // Evaluate guess
      if (guessUpper === targetWord.value) {
        gameState.value = 'won';
      } else if (currentRow.value === 5) {
        gameState.value = 'lost';
      }
      currentRow.value++;
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
  align-items: flex-start; /* Keep at top so it doesn't move */
  justify-content: center;
  padding: 10px;
}

.game-status-area {
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0 20px;
}

.status-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.status-content h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #538d4e;
}

.status-content p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.4;
  max-width: 400px;
}

.message-content {
  background: #3a3a3c;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: bold;
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
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
  flex-grow: 1;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 0;
  animation: slideUp 0.4s ease-out;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-height: 500px; /* Cap total height to match keyboard height */
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.meanings-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-height: 300px; /* More controlled height */
  overflow-y: auto;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin: 8px 0;
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

.speech-part {
  display: inline-block;
  background: #538d4e;
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.definition {
  margin: 4px 0 !important;
  font-size: 0.95rem;
  color: #ffffff;
}

.example {
  margin: 4px 0 !important;
  font-size: 0.85rem;
  color: #a0a0a0;
  font-style: italic;
}

.synonyms {
  margin-top: 4px;
  font-size: 0.85rem;
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
  padding: 8px 20px;
  font-size: 0.9rem;
  font-weight: bold;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  margin: 10px;
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
  padding: 0 10px 20px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 220px; /* Match typical keyboard height to keep layout stable */
}

h1 {
  font-size: 1.5rem;
  letter-spacing: 0.1rem;
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
