<template>
  <div id="app-container">
    <header>
      <div class="header-content">
        <h1>
          <img src="/apple-touch-icon.png" alt="F" class="title-icon" />
          reedle
        </h1>
        <div class="header-buttons">
          <DailyGameIcon
            :is-active="isDailyGame"
            @click="handleDailyGameClick"
          />
          <SettingsIcon @click="showSettingsModal = true" />
          <StatisticsIcon @click="showStatsModal = true" />
        </div>
      </div>
    </header>

    <main>
      <div class="game-grid" :style="gridStyle">
        <template v-for="(row, rowIndex) in 6" :key="rowIndex">
          <div :class="['row', { shake: shakingRow === rowIndex }]">
            <LetterTile
              v-for="(col, colIndex) in wordLength"
              :key="colIndex"
              :letter="getLetter(rowIndex, colIndex)"
              :color="getTileColor(rowIndex, colIndex)"
              :delay="getTileDelay(rowIndex, colIndex)"
              :count="getLetterCount(rowIndex, colIndex)"
              :animate="shouldAnimateTile(rowIndex)"
            />
          </div>
        </template>
      </div>
    </main>

    <div v-if="gameState === 'playing'" class="game-status-area">
      <ReloadToast :show="needRefresh" @reload="updateServiceWorker()" />
      <ValidationToast :show="!!message" :message="message || ''" />
    </div>

    <footer :class="{ 'is-endgame': gameState !== 'playing' }">
      <Keyboard
        v-if="gameState === 'playing'"
        :key-statuses="keyStatuses"
        :hard-mode="settingsStore.hardMode"
        @keyclick="onKeyClick"
      />
      <div v-else class="endgame-container">
        <div class="status-content">
          <h2 v-if="gameState === 'won'">Excellent! 🌟</h2>
          <h2 v-else>Game Over</h2>
          <p v-if="gameState === 'lost'" class="revealed-word">
            The word was: <strong>{{ targetWord }}</strong>
          </p>

          <div
            v-if="targetMeanings && targetMeanings.length > 0"
            class="meanings-container"
          >
            <div
              v-for="(m, idx) in targetMeanings"
              :key="idx"
              class="meaning-item"
            >
              <div class="meaning-header">
                <span v-if="m.speech_part" class="speech-part">{{
                  m.speech_part
                }}</span>
                <p class="definition">{{ m.def }}</p>
              </div>
              <p v-if="m.example" class="example">"{{ m.example }}"</p>
              <div v-if="m.synonyms && m.synonyms.length > 0" class="synonyms">
                <span class="syn-label">Synonyms:</span>
                {{ m.synonyms.join(", ") }}
              </div>
            </div>
          </div>

          <button @click="handleNewGameClick" class="new-game-btn">
            New Game
          </button>
        </div>
      </div>
    </footer>

    <AchievementToast
      :show="!!newAchievement"
      :achievement="newAchievement || {}"
    />

    <div v-if="isLoading" class="loading-overlay">
      <div class="loader"></div>
      <p>Loading Dictionary...</p>
    </div>

    <!-- Modals -->
    <SettingsModal
      :show="showSettingsModal"
      :is-game-in-progress="currentRow > 0 && gameState === 'playing'"
      @close="showSettingsModal = false"
      @word-length-change="handleWordLengthChange"
    />
    <StatsModal :show="showStatsModal" @close="showStatsModal = false" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import LetterTile from "./components/LetterTile.vue";
import Keyboard from "./components/Keyboard.vue";
import { useRegisterSW } from "virtual:pwa-register/vue";
import AchievementToast from "./components/AchievementToast.vue";
import ValidationToast from "./components/ValidationToast.vue";
import ReloadToast from "./components/ReloadToast.vue";
import SettingsModal from "./components/SettingsModal.vue";
import StatsModal from "./components/StatsModal.vue";
import SettingsIcon from "./components/SettingsIcon.vue";
import StatisticsIcon from "./components/StatisticsIcon.vue";
import DailyGameIcon from "./components/DailyGameIcon.vue";
import { useSettingsStore } from "./stores/settingsStore";
import { useGame } from "./composables/useGame";

// PWA
const { needRefresh, updateServiceWorker } = useRegisterSW();

// Stores
const settingsStore = useSettingsStore();

// Game composable
const {
  isLoading,
  currentRow,
  targetWord,
  targetMeanings,
  gameState,
  message,
  shakingRow,
  showWinAnimation,
  keyStatuses,
  wordLength,
  gridStyle,
  isDailyGame,
  fetchDictionary,
  resetGame,
  handleWordLengthChange,
  getLetter,
  getTileDelay,
  getTileColor,
  getLetterCount,
  shouldAnimateTile,
  handleKeyClick,
  isLetterAbsent,
} = useGame();

// Modal visibility
const showSettingsModal = ref(false);
const showStatsModal = ref(false);

// Handle daily game button click
function handleDailyGameClick() {
  if (isDailyGame.value) {
    // Already playing daily, start a random game instead
    resetGame();
  } else {
    // Start the daily game
    resetGame(true);
  }
}

function handleNewGameClick() {
  resetGame();
}

// Achievement notification
const newAchievement = ref(null);

// Show achievement notification
function showAchievementNotification(achievement) {
  newAchievement.value = achievement;
  setTimeout(() => {
    newAchievement.value = null;
  }, 3000);
}

// Show achievements sequentially
function showNewAchievements(achievements) {
  if (achievements.length === 0) return;
  let index = 0;
  function showNext() {
    if (index < achievements.length) {
      showAchievementNotification(achievements[index]);
      index++;
      setTimeout(showNext, 3500); // Wait for previous to finish plus small gap
    }
  }
  showNext();
}

// Wrapper for handleKeyClick that passes achievement callback
function onKeyClick(key) {
  handleKeyClick(key, showNewAchievements);
}

function handlePhysicalKeyDown(event) {
  // Don't handle keyboard when modals are open
  if (showSettingsModal.value || showStatsModal.value) return;
  if (event.ctrlKey || event.altKey || event.metaKey) return;
  let key = event.key;
  const isLetter = /^[a-zA-Z]$/.test(key);
  if (key !== "Backspace" && key !== "Enter" && !isLetter) return;
  if (gameState.value !== "playing" && key == "Enter") resetGame();
  else if (gameState.value !== "playing") return;
  event.preventDefault();
  if (isLetter) {
    key = key.toUpperCase();
    if (settingsStore.hardMode && isLetterAbsent(key)) {
      // In hard mode, ignore letters that are known to be absent
      return;
    }
  }
  onKeyClick(key);
  const button = document.getElementById(key);
  if (button) button.classList.add("active");
}

function handlePhysicalKeyUp(event) {
  const activeButtons = document.querySelectorAll(".key.active");
  for (const button of activeButtons) {
    button.classList.remove("active");
  }
}

onMounted(() => {
  window.addEventListener("keydown", handlePhysicalKeyDown);
  window.addEventListener("keyup", handlePhysicalKeyUp);
  fetchDictionary();
});

onUnmounted(() => {
  window.removeEventListener("keydown", handlePhysicalKeyDown);
  window.removeEventListener("keyup", handlePhysicalKeyUp);
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

.header-buttons {
  display: flex;
  gap: 8px;
}

.header-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #a0a0a0;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  transform: scale(1.05);
}

.header-btn:active {
  transform: scale(0.95);
}

.header-btn:focus {
  outline: none;
}

@media (max-width: 480px) {
  .header-btn {
    width: 38px;
    height: 38px;
  }

  .header-btn svg {
    width: 18px;
    height: 18px;
  }
}

main {
  margin-top: 10px;
  display: flex;
  align-items: flex-start; /* Keep at top so it doesn't move */
  justify-content: center;
  padding: 0 5px; /* Removed vertical padding */
  overflow: hidden;
}

.game-status-area {
  flex-grow: 1;
  min-height: 80px; /* Reserve space for the toast */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0 10px;
  position: relative; /* For child z-index */
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
  margin-top: 4px;
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

@keyframes shake {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }
  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }
  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }
  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
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
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
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
  background: linear-gradient(rgb(110, 169, 94), rgb(83, 125, 78));
  color: white;
  border: none;
  padding: 10px 24px;
  font-size: 1.5rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin: 4px;
  flex-shrink: 0;
  width: 100%;
}

.new-game-btn:hover {
  background: linear-gradient(rgba(110, 169, 94, 0.8), rgba(83, 125, 78, 0.8));
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
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

footer {
  padding: 0 0px 8px 0px;
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
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
