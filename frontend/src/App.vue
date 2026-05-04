<template>
  <div id="app-container">
    <header>
      <div class="header-content">
        <h1>
          <img :src="appIconUrl" alt="F" class="title-icon" />
          reedle
        </h1>
        <div class="header-buttons">
          <DailyGameIcon
            :is-active="isDailyGame"
            :day-of-month="currentDayOfMonth"
            @click="handleDailyGameClick"
          />
          <SettingsIcon @click="showSettingsModal = true" />
          <StatisticsIcon @click="showStatsModal = true" />
        </div>
      </div>
    </header>

    <main>
      <div class="board-stage">
        <div v-if="isSharedGame" class="challenge-ribbon" aria-label="Challenge mode active">
          <span class="challenge-ribbon-kicker">Challenge Mode</span>
          <span class="challenge-ribbon-divider"></span>
          <span class="challenge-ribbon-copy">Social game · stats disabled</span>
        </div>

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
                :flip="shouldFlipTile(rowIndex)"
                :is-current-row="rowIndex === currentRow"
              />
            </div>
          </template>
        </div>
      </div>
    </main>

    <div v-if="gameState === 'playing'" class="game-status-area">
      <ReloadToast :show="needRefresh" @reload="updateServiceWorker()" />
      <ValidationToast :show="!!message" :message="message || ''" />
    </div>

    <footer :class="{ 'is-endgame': gameState !== 'playing' }">
      <VirtualKeyboard
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

          <EndgameButtons
            :guesses="guesses"
            :target-word="targetWord"
            :word-length="wordLength"
            :is-daily-game="isDailyGame"
            :current-dictionary-version="currentDictionaryVersion"
            :current-random-seed="currentRandomSeed"
            :current-daily-date="currentDailyDate"
            @new-game="handleNewGameClick"
          />
        </div>
      </div>
    </footer>

    <AchievementToast
      :show="!!newAchievement"
      :achievement="newAchievement || {}"
    />

    <BaseToast
      :show="appToast.show"
      :glow-color="appToast.glowColor"
      position="top-fixed"
    >
      <template #icon>{{ appToast.icon }}</template>
      <template #title>{{ appToast.title }}</template>
      <template #message>{{ appToast.message }}</template>
    </BaseToast>

    <div v-if="isLoading || isHandlingShare" class="loading-overlay">
      <div class="loader"></div>
      <p>{{ loadingMessage }}</p>
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
import { computed, ref, onMounted, onUnmounted } from "vue";
import LetterTile from "./components/LetterTile.vue";
import VirtualKeyboard from "./components/VirtualKeyboard.vue";
import { useRegisterSW } from "virtual:pwa-register/vue";
import AchievementToast from "./components/AchievementToast.vue";
import BaseToast from "./components/BaseToast.vue";
import ValidationToast from "./components/ValidationToast.vue";
import ReloadToast from "./components/ReloadToast.vue";
import SettingsModal from "./components/SettingsModal.vue";
import StatsModal from "./components/StatsModal.vue";
import SettingsIcon from "./components/SettingsIcon.vue";
import StatisticsIcon from "./components/StatisticsIcon.vue";
import DailyGameIcon from "./components/DailyGameIcon.vue";
import EndgameButtons from "./components/EndgameButtons.vue";
import { LATEST_DICT_VERSION } from "./constants/dictionary";
import { useSettingsStore } from "./stores/settingsStore";
import { resolveSharedChallengeWord, useGame } from "./composables/useGame";
import { parseShareParams, verifyShare } from "./utils/shareLink";

// PWA
const { needRefresh, updateServiceWorker } = useRegisterSW();
const appIconUrl = `${import.meta.env.BASE_URL}apple-touch-icon.png`;

// Stores
const settingsStore = useSettingsStore();

// Game composable
const {
  isLoading,
  guesses,
  currentRow,
  targetWord,
  targetMeanings,
  gameState,
  message,
  shakingRow,
  keyStatuses,
  wordLength,
  gridStyle,
  isDailyGame,
  isSharedGame,
  currentDictionaryVersion,
  currentRandomSeed,
  currentDailyDate,
  fetchDictionary,
  loadDictionaryVersion,
  loadSharedGame,
  resetGame,
  handleWordLengthChange,
  getLetter,
  getTileDelay,
  getTileColor,
  getLetterCount,
  shouldFlipTile,
  handleKeyClick,
  isLetterAbsent,
} = useGame();

// Current day of month (updated when app becomes visible)
const currentDayOfMonth = ref(new Date().getDate());

// Modal visibility
const showSettingsModal = ref(false);
const showStatsModal = ref(false);
const isHandlingShare = ref(false);
const loadingMessage = computed(() =>
  isHandlingShare.value ? "Loading Challenge..." : "Loading Dictionary...",
);

const appToast = ref({
  show: false,
  title: "",
  message: "",
  icon: "🔗",
  glowColor: "#446cc9",
});

let appToastTimerId = null;

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

function showAppToast({
  title,
  message,
  icon = "🔗",
  glowColor = "#446cc9",
  duration = 3200,
}) {
  appToast.value = {
    show: true,
    title,
    message,
    icon,
    glowColor,
  };

  if (appToastTimerId !== null) {
    clearTimeout(appToastTimerId);
  }

  appToastTimerId = window.setTimeout(() => {
    appToast.value = {
      ...appToast.value,
      show: false,
    };
    appToastTimerId = null;
  }, duration);
}

function clearShareParamsFromAddressBar() {
  window.history.replaceState(null, "", window.location.pathname);
}

async function resolveAndLoadSharedChallenge(shareData) {
  if (shareData.version > LATEST_DICT_VERSION) {
    showAppToast({
      title: "Update Required",
      message: "Update Freedle to play this challenge",
      icon: "⬆️",
      glowColor: "#d6932f",
      duration: 3600,
    });
    return false;
  }

  try {
    const dictionaryData = await loadDictionaryVersion(shareData.version);
    const selectedWord = resolveSharedChallengeWord(shareData, dictionaryData);
    const verified = selectedWord !== null &&
      await verifyShare(shareData, selectedWord.word);

    if (!verified || selectedWord === null) {
      showAppToast({
        title: "Invalid Challenge",
        message: "This challenge link is invalid or from a modified dictionary",
        icon: "⚠️",
        glowColor: "#c94444",
        duration: 3800,
      });
      return false;
    }

    await loadSharedGame({
      shareData,
      dictionaryData,
      selectedWord,
    });

    return true;
  } catch (error) {
    console.error("Failed to open shared challenge", error);
    showAppToast({
      title: "Challenge Unavailable",
      message: error?.message || "Could not open this challenge link.",
      icon: "⚠️",
      glowColor: "#c94444",
      duration: 3800,
    });
    return false;
  }
}

async function handleSharedChallenge(shareData) {
  if (!shareData) {
    return false;
  }

  const loaded = await resolveAndLoadSharedChallenge(shareData);
  clearShareParamsFromAddressBar();
  return loaded;
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
  if (showSettingsModal.value || showStatsModal.value) {
    return;
  }
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

function handlePhysicalKeyUp() {
  const activeButtons = document.querySelectorAll(".key.active");
  for (const button of activeButtons) {
    button.classList.remove("active");
  }
}

function handleVisibilityChange() {
  if (document.visibilityState === "visible") {
    // Update the day of month when app becomes visible
    currentDayOfMonth.value = new Date().getDate();
  }
}

onMounted(() => {
  window.addEventListener("keydown", handlePhysicalKeyDown);
  window.addEventListener("keyup", handlePhysicalKeyUp);
  window.addEventListener("touchend", handlePhysicalKeyUp);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  const boot = async () => {
    const sharedChallenge = parseShareParams(
      new URLSearchParams(window.location.search),
    );

    if (!sharedChallenge) {
      await fetchDictionary();
      return;
    }

    isHandlingShare.value = true;

    try {
      await fetchDictionary({ startGame: false });
      const loaded = await handleSharedChallenge(sharedChallenge);

      if (!loaded && !targetWord.value) {
        await resetGame();
      }
    } finally {
      isHandlingShare.value = false;
    }
  };

  boot();
});

onUnmounted(() => {
  window.removeEventListener("keydown", handlePhysicalKeyDown);
  window.removeEventListener("keyup", handlePhysicalKeyUp);
  window.removeEventListener("touchend", handlePhysicalKeyUp);
  document.removeEventListener("visibilitychange", handleVisibilityChange);

  if (appToastTimerId !== null) {
    clearTimeout(appToastTimerId);
  }
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

.board-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.challenge-ribbon {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  max-width: min(100%, 420px);
  padding: 8px 14px;
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)),
    rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 12px 28px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(8px);
  animation: challengeFadeIn 0.35s ease-out;
}

.challenge-ribbon-kicker {
  color: #9fd492;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.16rem;
  text-transform: uppercase;
  white-space: nowrap;
}

.challenge-ribbon-divider {
  width: 1px;
  height: 16px;
  background: linear-gradient(
    180deg,
    rgba(159, 212, 146, 0),
    rgba(159, 212, 146, 0.65),
    rgba(159, 212, 146, 0)
  );
}

.challenge-ribbon-copy {
  color: #c7cec8;
  font-size: 0.84rem;
  letter-spacing: 0.02rem;
  white-space: nowrap;
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

@keyframes challengeFadeIn {
  from {
    opacity: 0;
    transform: translateY(-6px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 480px) {
  .challenge-ribbon {
    gap: 8px;
    padding: 8px 12px;
  }

  .challenge-ribbon-kicker {
    font-size: 0.69rem;
    letter-spacing: 0.12rem;
  }

  .challenge-ribbon-copy {
    font-size: 0.75rem;
  }
}
</style>
