import { ref, computed } from "vue";
import { useSettingsStore } from "../stores/settingsStore";
import { useStatsStore } from "../stores/statsStore";
import { useDailyGameStore } from "../stores/dailyGameStore";
import {
  DATA_CACHE_NAME,
  LATEST_DICT_VERSION,
} from "../constants/dictionary";

// Seeded random number generator (mulberry32)
function seededRandom(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function evaluateTileColor(guess, target, colIndex) {
  const normalizedGuess = guess.toUpperCase();
  const normalizedTarget = target.toUpperCase();
  const letter = normalizedGuess[colIndex];

  if (!letter) return "idle";

  // 1. Correct position
  if (letter === normalizedTarget[colIndex]) {
    return "correct";
  }

  // 2. Present/Absent logic with count handling
  let targetCount = 0;
  for (let i = 0; i < normalizedTarget.length; i++) {
    if (normalizedTarget[i] === letter) targetCount++;
  }

  let correctCount = 0;
  for (let i = 0; i < normalizedTarget.length; i++) {
    if (
      normalizedGuess[i] === letter &&
      normalizedGuess[i] === normalizedTarget[i]
    ) {
      correctCount++;
    }
  }

  let presentBeforeCount = 0;
  for (let i = 0; i < colIndex; i++) {
    if (
      normalizedGuess[i] === letter &&
      normalizedGuess[i] !== normalizedTarget[i]
    ) {
      presentBeforeCount++;
    }
  }

  if (
    normalizedTarget.includes(letter) &&
    correctCount + presentBeforeCount < targetCount
  ) {
    return "present";
  }

  return "absent";
}

export function validateHardModeGuess(previousGuesses, guess, target) {
  const normalizedGuess = guess.toUpperCase();
  const normalizedTarget = target.toUpperCase();

  for (const previousGuess of previousGuesses) {
    const normalizedPreviousGuess = previousGuess.toUpperCase();

    // Green letters must stay fixed in later guesses.
    for (let i = 0; i < normalizedPreviousGuess.length; i++) {
      if (
        normalizedPreviousGuess[i] === normalizedTarget[i] &&
        normalizedGuess[i] !== normalizedPreviousGuess[i]
      ) {
        return `Position ${i + 1} must be ${normalizedPreviousGuess[i]}`;
      }
    }

    // Yellow letters must appear somewhere in the next guess.
    for (let i = 0; i < normalizedPreviousGuess.length; i++) {
      const letter = normalizedPreviousGuess[i];
      if (
        letter !== normalizedTarget[i] &&
        normalizedTarget.includes(letter) &&
        !normalizedGuess.includes(letter)
      ) {
        return `Guess must contain ${letter}`;
      }
    }
  }

  return "";
}

export function useGame() {
  const settingsStore = useSettingsStore();
  const statsStore = useStatsStore();
  const dailyGameStore = useDailyGameStore();
  const dictionaryVersionCache = new Map();

  // Active word length can temporarily diverge from persisted settings.
  const activeWordLength = ref(settingsStore.wordLength);
  const wordLength = computed(() => activeWordLength.value);

  // Game state
  const isLoading = ref(true);
  const isDailyGame = ref(false);
  const dictionary = ref({});
  const allowedGuesses = ref({ 4: [], 5: [], 6: [] });
  const answerWords = ref({ 4: [], 5: [], 6: [] });
  const guesses = ref(["", "", "", "", "", ""]);
  const currentRow = ref(0);
  const targetWord = ref("");
  const targetMeanings = ref([]);
  const gameState = ref("playing"); // 'playing', 'won', 'lost'
  const message = ref("");
  const shakingRow = ref(-1);
  const keyStatuses = ref({});
  const justSubmittedRow = ref(-1);

  // Grid style computed
  const gridStyle = computed(() => ({
    "--cols": wordLength.value,
  }));

  function createWordBuckets() {
    return { 4: [], 5: [], 6: [] };
  }

  function getVersionedDataFiles(version) {
    return {
      dictionaryFile: `target-dictionary-v${version}.json`,
      allowedGuessesFile: `allowed-guesses-v${version}.txt`,
    };
  }

  function getRandomWord(length, daily = false) {
    const words = answerWords.value[length];
    if (!words || words.length === 0) return null;

    let selectedWord;
    if (daily) {
      // Use seeded random for daily game
      const seed = dailyGameStore.dateKey + length; // Add length to vary by word length
      const rng = seededRandom(seed);
      selectedWord = words[Math.floor(rng() * words.length)];
    } else {
      selectedWord = words[Math.floor(Math.random() * words.length)];
    }

    const wordData = dictionary.value[selectedWord.toLowerCase()];
    return {
      word: selectedWord,
      meanings: wordData ? wordData.meanings : [],
    };
  }

  // Persistent client-side ID
  const clientId = (() => {
    let id = localStorage.getItem("freedle_client_id");
    if (!id) {
      id = "c_" + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
      localStorage.setItem("freedle_client_id", id);
    }
    return id;
  })();

  async function logGameStart(data) {
    const base = import.meta.env.VITE_API_BASE;
    try {
      const res = await fetch(`${base}/events/game-start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, client_id: clientId }),
      });
      if (!res.ok) console.warn("Failed to log game start", res.status);
    } catch (error) {
      console.warn("Failed to log game start", error);
    }
  }

  async function logGameWin(data) {
    const base = import.meta.env.VITE_API_BASE;
    try {
      const res = await fetch(`${base}/events/game-win`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, client_id: clientId }),
      });

      if (!res.ok) console.warn("Failed to log game win", res.status);
    } catch (error) {
      console.warn("Failed to log game win", error);
    }
  }

  async function logGameLoss(data) {
    const base = import.meta.env.VITE_API_BASE;
    try {
      const res = await fetch(`${base}/events/game-loss`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, client_id: clientId }),
      });

      if (!res.ok) console.warn("Failed to log game loss", res.status);
    } catch (error) {
      console.warn("Failed to log game loss", error);
    }
  }

  async function resetGame(daily = false) {
    isDailyGame.value = daily;
    activeWordLength.value = settingsStore.wordLength;
    // If daily game, try to restore saved state
    if (daily) {
      const savedState = dailyGameStore.getGameState(wordLength.value);
      if (savedState) {
        justSubmittedRow.value = -1; // No row was just submitted on restore
        message.value = "";
        shakingRow.value = -1;
        guesses.value = savedState.guesses;
        currentRow.value = savedState.currentRow;
        gameState.value = savedState.gameState;
        targetWord.value = savedState.targetWord;
        targetMeanings.value = savedState.targetMeanings;
        keyStatuses.value = savedState.keyStatuses;
        settingsStore.hardMode = savedState.hardMode;
        if (import.meta.env.DEV) {
          console.log(`[DEV] Restored Daily Game: ${targetWord.value}`);
        }
        return;
      }
    }
    // Fresh game start
    guesses.value = ["", "", "", "", "", ""];
    currentRow.value = 0;
    gameState.value = "playing";
    message.value = "";
    shakingRow.value = -1;
    keyStatuses.value = {};
    justSubmittedRow.value = -1;
    const selected = getRandomWord(wordLength.value, daily);
    if (selected) {
      targetWord.value = selected.word;
      targetMeanings.value = selected.meanings;
      if (daily) {
        saveDailyGameState();
      }
      // Debug info in dev mode
      if (import.meta.env.DEV) {
        console.log(
          `[DEV] Target Word: ${targetWord.value}${daily ? " (Daily)" : ""}`,
        );
      }
    }
    await logGameStart({
      daily: daily,
      word: targetWord.value,
      length: wordLength.value,
      viewport: window.innerWidth + "x" + window.innerHeight,
    });
  }

  // Helper to save current daily game state
  function saveDailyGameState() {
    if (!isDailyGame.value) return;
    dailyGameStore.saveGameState(wordLength.value, {
      guesses: guesses.value,
      currentRow: currentRow.value,
      gameState: gameState.value,
      targetWord: targetWord.value,
      targetMeanings: targetMeanings.value,
      keyStatuses: keyStatuses.value,
      hardMode: settingsStore.hardMode,
    });
  }

  const buildDataUrl = (fileName) => `${import.meta.env.BASE_URL}data/${fileName}`;

  const fetchWithOfflineCache = async (fileName) => {
    const url = buildDataUrl(fileName);
    const cache = typeof window !== "undefined" && "caches" in window
      ? await caches.open(DATA_CACHE_NAME)
      : null;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const fetchError = new Error(`Failed to fetch ${fileName}: ${response.status}`);
        fetchError.status = response.status;
        fetchError.fileName = fileName;
        throw fetchError;
      }
      if (cache) {
        await cache.put(url, response.clone());
      }
      return response;
    } catch (error) {
      if (cache) {
        const cachedResponse = await cache.match(url);
        if (cachedResponse) {
          return cachedResponse;
        }
      }
      throw error;
    }
  };

  async function loadDictionaryVersion(version) {
    if (!Number.isInteger(version) || version < 1) {
      throw new Error(`Invalid dictionary version: ${version}`);
    }

    if (dictionaryVersionCache.has(version)) {
      return dictionaryVersionCache.get(version);
    }

    const loadPromise = (async () => {
      const { dictionaryFile, allowedGuessesFile } = getVersionedDataFiles(version);

      try {
        const [dictRes, allowedRes] = await Promise.all([
          fetchWithOfflineCache(dictionaryFile),
          fetchWithOfflineCache(allowedGuessesFile),
        ]);

        const dictData = await dictRes.json();
        const allowedText = await allowedRes.text();
        const valid = createWordBuckets();
        const answers = createWordBuckets();

        allowedText.split("\n").forEach((line) => {
          const word = line.trim().toUpperCase();
          if (word && word.length >= 4 && word.length <= 6) {
            valid[word.length].push(word);
          }
        });

        Object.keys(dictData).forEach((word) => {
          const len = word.length;
          if (answers[len]) {
            answers[len].push(word.toUpperCase());
          }
        });

        return {
          dictionary: dictData,
          allowedGuesses: valid,
          answerWords: answers,
        };
      } catch (error) {
        if (error?.status === 404) {
          throw new Error(`Dictionary version ${version} is unavailable.`);
        }
        throw error;
      }
    })();

    dictionaryVersionCache.set(version, loadPromise);

    try {
      return await loadPromise;
    } catch (error) {
      dictionaryVersionCache.delete(version);
      throw error;
    }
  }

  async function fetchDictionary() {
    try {
      isLoading.value = true;
      const latestDictionary = await loadDictionaryVersion(LATEST_DICT_VERSION);
      const { dictionary: dictData, allowedGuesses: valid, answerWords: answers } =
        latestDictionary;

      dictionary.value = dictData;
      allowedGuesses.value = valid;
      answerWords.value = answers;
      message.value = "";
      await resetGame();
    } catch (error) {
      console.error("Failed to load dictionary:", error);
      if (error.message.startsWith("Dictionary version ")) {
        message.value = error.message;
      } else {
        message.value = "Dictionary unavailable offline. Open Freedle once online to cache game data.";
      }
    } finally {
      isLoading.value = false;
    }
  }

  function handleWordLengthChange(len) {
    settingsStore.setWordLength(len);
    activeWordLength.value = settingsStore.wordLength;
    resetGame(isDailyGame.value);
  }

  function updateKeyStatuses(guess) {
    const target = targetWord.value.toUpperCase();
    const newStatuses = { ...keyStatuses.value };
    guess.split("").forEach((letter, j) => {
      const currentStatus = newStatuses[letter];
      if (letter === target[j]) {
        newStatuses[letter] = "correct";
      } else if (target.includes(letter)) {
        if (currentStatus !== "correct") {
          newStatuses[letter] = "present";
        }
      } else {
        if (currentStatus !== "correct" && currentStatus !== "present") {
          newStatuses[letter] = "absent";
        }
      }
    });
    keyStatuses.value = newStatuses;
  }

  function getLetter(rowIndex, colIndex) {
    return guesses.value[rowIndex][colIndex] || "";
  }

  function getTileDelay(rowIndex, colIndex) {
    if (rowIndex === justSubmittedRow.value) {
      return `${colIndex * 150}ms`;
    }
    return "0ms";
  }

  function shouldFlipTile(rowIndex) {
    return rowIndex === justSubmittedRow.value;
  }

  function getTileColor(rowIndex, colIndex) {
    if (rowIndex >= currentRow.value) return "idle";
    return evaluateTileColor(guesses.value[rowIndex], targetWord.value, colIndex);
  }

  // Get letter count for count mode (shows how many times a letter appears in target)
  function getLetterCount(rowIndex, colIndex) {
    // Only show count if count mode is enabled and tile is from a submitted guess
    if (!settingsStore.countMode || rowIndex >= currentRow.value) return 0;
    const guess = guesses.value[rowIndex].toUpperCase();
    const target = targetWord.value.toUpperCase();
    const letter = guess[colIndex];
    // Count how many times this letter appears in the target
    let count = 0;
    for (let i = 0; i < target.length; i++) {
      if (target[i] === letter) count++;
    }
    return count;
  }

  function handleKeyClick(key, onAchievements) {
    if (gameState.value !== "playing") return;
    const currentGuess = guesses.value[currentRow.value];
    if (key === "Backspace") {
      guesses.value[currentRow.value] = currentGuess.slice(0, -1);
    } else if (key === "Enter") {
      if (currentGuess.length === wordLength.value) {
        // Validate guess against full dictionary (if not in test mode)
        const guessUpper = currentGuess.toUpperCase();
        const isValid =
          allowedGuesses.value[wordLength.value].includes(guessUpper);
        if (!isValid) {
          message.value = "Not in word list";
          shakingRow.value = currentRow.value;
          setTimeout(() => {
            message.value = "";
            shakingRow.value = -1;
          }, 1500);
          return;
        }
        // Hard mode validation
        if (settingsStore.hardMode && currentRow.value > 0) {
          const hardModeMessage = validateHardModeGuess(
            guesses.value.slice(0, currentRow.value),
            guessUpper,
            targetWord.value,
          );

          if (hardModeMessage) {
            message.value = hardModeMessage;
            shakingRow.value = currentRow.value;
            setTimeout(() => {
              message.value = "";
              shakingRow.value = -1;
            }, 1500);
            return;
          }
        }
        // Update keyboard statuses after flips
        updateKeyStatuses(guessUpper);
        // Mark this row as just submitted for animation
        justSubmittedRow.value = currentRow.value;
        currentRow.value++;
        // Evaluate guess
        setTimeout(
          () => {
            if (guessUpper === targetWord.value) {
              gameState.value = "won";
              logGameWin({
                word: targetWord.value,
                guessCount: currentRow.value,
              });
              const newAchievements = statsStore.recordWin(
                currentRow.value,
                wordLength.value,
                {
                  hardMode: settingsStore.hardMode,
                  countMode: settingsStore.countMode,
                },
              );
              if (newAchievements.length > 0 && onAchievements) {
                onAchievements(newAchievements);
              }
            } else if (currentRow.value === 6) {
              gameState.value = "lost";
              logGameLoss({
                word: targetWord.value,
                lastGuess: guessUpper,
              });
              const newAchievements = statsStore.recordLoss();
              if (newAchievements.length > 0 && onAchievements) {
                onAchievements(newAchievements);
              }
            }
            if (isDailyGame.value) {
              saveDailyGameState();
            }
          },
          wordLength.value * 150 + 400,
        );
        message.value = "";
      }
    } else if (currentGuess.length < wordLength.value) {
      if (/^[A-Z]$/i.test(key)) {
        guesses.value[currentRow.value] += key.toUpperCase();
      }
    }
  }

  function isLetterAbsent(letter) {
    return keyStatuses.value[letter] === "absent";
  }

  return {
    // State
    isLoading,
    guesses,
    currentRow,
    targetWord,
    targetMeanings,
    gameState,
    message,
    shakingRow,
    keyStatuses,
    activeWordLength,
    wordLength,
    gridStyle,
    isDailyGame,
    loadDictionaryVersion,

    // Methods
    fetchDictionary,
    resetGame,
    handleWordLengthChange,
    getLetter,
    getTileDelay,
    getTileColor,
    getLetterCount,
    shouldFlipTile,
    handleKeyClick,
    isLetterAbsent,
  };
}
