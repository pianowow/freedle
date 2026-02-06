import { ref, computed } from "vue";
import { useSettingsStore } from "../stores/settingsStore";
import { useStatsStore } from "../stores/statsStore";
import { useDailyGameStore } from "../stores/dailyGameStore";

// Seeded random number generator (mulberry32)
function seededRandom(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function useGame() {
  const settingsStore = useSettingsStore();
  const statsStore = useStatsStore();
  const dailyGameStore = useDailyGameStore();

  // Word length from settings store
  const wordLength = computed(() => settingsStore.wordLength);

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

  async function logGameStart(data) {
    const base = import.meta.env.VITE_API_BASE;
    const res = await fetch(`${base}/events/game-start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data || {}),
    });
    if (!res.ok) console.warn("Failed to log game start", res.status);
  }

  async function logGameWin(data) {
    const base = import.meta.env.VITE_API_BASE;
    const res = await fetch(`${base}/events/game-win`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data || {}),
    });

    if (!res.ok) console.warn("Failed to log game win", res.status);
  }

  async function logGameLoss(data) {
    const base = import.meta.env.VITE_API_BASE;
    const res = await fetch(`${base}/events/game-loss`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data || {}),
    });

    if (!res.ok) console.warn("Failed to log game loss", res.status);
  }

  async function resetGame(daily = false) {
    isDailyGame.value = daily;
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

  async function fetchDictionary() {
    try {
      isLoading.value = true;
      // Fetch dictionary (common words with definitions) and allowed guesses
      const [dictRes, allowedRes] = await Promise.all([
        fetch("data/target-dictionary.json"),
        fetch("data/allowed-guesses.txt"),
      ]);
      const dictData = await dictRes.json();
      const allowedText = await allowedRes.text();
      const valid = { 4: [], 5: [], 6: [] };
      const answers = { 4: [], 5: [], 6: [] };
      // Populate valid guesses from allowed-guesses.txt
      allowedText.split("\n").forEach((line) => {
        const word = line.trim().toUpperCase();
        if (word && word.length >= 4 && word.length <= 6) {
          valid[word.length].push(word);
        }
      });
      // Populate target answers from target-dictionary.json
      Object.keys(dictData).forEach((word) => {
        const len = word.length;
        if (answers[len]) {
          answers[len].push(word.toUpperCase());
        }
      });
      dictionary.value = dictData;
      allowedGuesses.value = valid;
      answerWords.value = answers;
    } catch (error) {
      console.error("Failed to load dictionary:", error);
    } finally {
      isLoading.value = false;
      resetGame();
    }
  }

  function handleWordLengthChange(len) {
    settingsStore.setWordLength(len);
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
    const guess = guesses.value[rowIndex].toUpperCase();
    const target = targetWord.value.toUpperCase();
    const letter = guess[colIndex];
    // 1. Correct position
    if (letter === target[colIndex]) {
      return "correct";
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
    if (
      target.includes(letter) &&
      correctCount + presentBeforeCount < targetCount
    ) {
      return "present";
    }
    return "absent";
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
          const target = targetWord.value.toUpperCase();
          // Check all previous guesses for revealed hints
          for (let prevRow = 0; prevRow < currentRow.value; prevRow++) {
            const prevGuess = guesses.value[prevRow].toUpperCase();
            // Check green letters (must be in same position)
            for (let i = 0; i < prevGuess.length; i++) {
              if (
                prevGuess[i] === target[i] &&
                guessUpper[i] !== prevGuess[i]
              ) {
                message.value = `Position ${i + 1} must be ${prevGuess[i]}`;
                shakingRow.value = currentRow.value;
                setTimeout(() => {
                  message.value = "";
                  shakingRow.value = -1;
                }, 1500);
                return;
              }
            }
            // Check yellow letters (must be present somewhere)
            for (let i = 0; i < prevGuess.length; i++) {
              const letter = prevGuess[i];
              if (letter !== target[i] && target.includes(letter)) {
                if (!guessUpper.includes(letter)) {
                  message.value = `Guess must contain ${letter}`;
                  shakingRow.value = currentRow.value;
                  setTimeout(() => {
                    message.value = "";
                    shakingRow.value = -1;
                  }, 1500);
                  return;
                }
              }
            }
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
    wordLength,
    gridStyle,
    isDailyGame,

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
