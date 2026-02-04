import { defineStore } from "pinia";
import { ref, watch } from "vue";

const STORAGE_KEY = "freedle-daily-game";

// Get today's date as YYYYMMDD number
function getTodayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  return year * 10000 + month * 100 + day;
}

export const useDailyGameStore = defineStore("dailyGame", () => {
  // Load initial state from localStorage
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  const todayKey = getTodayKey();

  // Check if saved state is from today
  const isFromToday = saved.dateKey === todayKey;

  // Daily game state (keyed by word length)
  // Structure: { dateKey, games: { 4: {...}, 5: {...}, 6: {...} } }
  const dateKey = ref(isFromToday ? saved.dateKey : todayKey);
  const games = ref(
    isFromToday
      ? saved.games || {}
      : {}
  );

  // Save to localStorage whenever state changes
  function saveToStorage() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        dateKey: dateKey.value,
        games: games.value,
      })
    );
  }

  // Watch for changes and persist
  watch([dateKey, games], saveToStorage, { deep: true });

  // Get saved game state for a word length
  function getGameState(wordLength) {
    const today = getTodayKey();
    // If it's a new day, clear old state
    if (dateKey.value !== today) {
      dateKey.value = today;
      games.value = {};
      return null;
    }
    return games.value[wordLength] || null;
  }

  // Save game state for a word length
  function saveGameState(wordLength, state) {
    const today = getTodayKey();
    // If it's a new day, reset
    if (dateKey.value !== today) {
      dateKey.value = today;
      games.value = {};
    }
    games.value[wordLength] = { ...state };
  }

  // Clear game state for a word length (e.g., when starting fresh)
  function clearGameState(wordLength) {
    if (games.value[wordLength]) {
      delete games.value[wordLength];
    }
  }

  // Check if daily game is completed for a word length
  function isCompleted(wordLength) {
    const state = getGameState(wordLength);
    return state && (state.gameState === "won" || state.gameState === "lost");
  }

  return {
    dateKey,
    games,
    getGameState,
    saveGameState,
    clearGameState,
    isCompleted,
  };
});