import { ref, computed } from "vue";
import { useSettingsStore } from "../stores/settingsStore";
import { useStatsStore } from "../stores/statsStore";

export function useGame() {
  const settingsStore = useSettingsStore();
  const statsStore = useStatsStore();

  // Word length from settings store
  const wordLength = computed(() => settingsStore.wordLength);

  // Game state
  const isLoading = ref(true);
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
  const showWinAnimation = ref(false);
  const keyStatuses = ref({});

  // Grid style computed
  const gridStyle = computed(() => ({
    "--cols": wordLength.value,
  }));

  function getRandomWord(length) {
    const words = answerWords.value[length];
    if (!words || words.length === 0) return null;
    const selectedWord = words[Math.floor(Math.random() * words.length)];
    const wordData = dictionary.value[selectedWord.toLowerCase()];
    return {
      word: selectedWord,
      meanings: wordData ? wordData.meanings : [],
    };
  }

  function resetGame() {
    guesses.value = ["", "", "", "", "", ""];
    currentRow.value = 0;
    gameState.value = "playing";
    message.value = "";
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
    resetGame();
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
    // Update the keyboard all at once after the first tile begins to flip
    setTimeout(() => {
      keyStatuses.value = newStatuses;
    }, 150);
  }

  function getLetter(rowIndex, colIndex) {
    return guesses.value[rowIndex][colIndex] || "";
  }

  function getTileDelay(rowIndex, colIndex) {
    if (rowIndex === currentRow.value - 1) {
      return `${colIndex * 150}ms`;
    }
    return "0ms";
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
        // Evaluate guess
        if (guessUpper === targetWord.value) {
          const guessCount = currentRow.value + 1;
          currentRow.value++;
          // Delay the win message and animation until flips are done
          setTimeout(() => {
            gameState.value = "won";
            showWinAnimation.value = true;
            // Record win and check achievements
            const newAchievements = statsStore.recordWin(
              guessCount,
              wordLength.value,
              {
                hardMode: settingsStore.hardMode,
                countMode: settingsStore.countMode,
              }
            );
            if (newAchievements.length > 0 && onAchievements) {
              onAchievements(newAchievements);
            }
          }, wordLength.value * 150 + 400);
        } else if (currentRow.value === 5) {
          currentRow.value++;
          setTimeout(() => {
            gameState.value = "lost";
            // Record loss and check achievements
            const newAchievements = statsStore.recordLoss();
            if (newAchievements.length > 0 && onAchievements) {
              onAchievements(newAchievements);
            }
          }, wordLength.value * 150 + 400);
        } else {
          currentRow.value++;
        }
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
    showWinAnimation,
    keyStatuses,
    wordLength,
    gridStyle,

    // Methods
    fetchDictionary,
    resetGame,
    handleWordLengthChange,
    getLetter,
    getTileDelay,
    getTileColor,
    getLetterCount,
    handleKeyClick,
    isLetterAbsent,
  };
}
