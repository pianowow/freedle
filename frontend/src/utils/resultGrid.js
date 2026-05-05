import { evaluateTileColor } from "../composables/useGame";

const SUPPORTED_WORD_LENGTHS = new Set([4, 5, 6]);
const TILE_EMOJI = {
  correct: "🟩",
  present: "🟨",
  absent: "⬛",
  idle: "⬛",
};

function normalizeWord(value) {
  return String(value ?? "").trim().toUpperCase();
}

function normalizeGuesses(guesses, wordLength) {
  if (!Array.isArray(guesses)) {
    return [];
  }

  return guesses
    .map(normalizeWord)
    .filter((guess) => guess.length === wordLength);
}

function getSubmittedGuesses(guesses, target) {
  const submittedGuesses = [];

  for (const guess of guesses) {
    submittedGuesses.push(guess);

    if (guess === target) {
      break;
    }
  }

  return submittedGuesses;
}

function buildHeader(submittedGuesses, target) {
  const winningGuessIndex = submittedGuesses.findIndex((guess) => guess === target);

  if (winningGuessIndex === -1) {
    return "Freedle — Loss! 😖";
  }

  const guessCount = winningGuessIndex + 1;
  const guessLabel = guessCount === 1 ? "Guess" : "Guesses";
  return `Freedle — ${guessCount} ${guessLabel}! ⭐`;
}

function buildCallToAction(submittedGuesses, target) {
  return submittedGuesses.includes(target)
    ? "Can you beat my score?!"
    : "Can you solve it?!";
}

export function buildResultGrid({ guesses, target, wordLength }) {
  if (!SUPPORTED_WORD_LENGTHS.has(wordLength)) {
    throw new Error(`Unsupported share word length: ${wordLength}`);
  }

  const normalizedTarget = normalizeWord(target);
  if (normalizedTarget.length !== wordLength) {
    throw new Error("Target word length does not match the requested share length.");
  }

  const normalizedGuesses = normalizeGuesses(guesses, wordLength);
  const submittedGuesses = getSubmittedGuesses(normalizedGuesses, normalizedTarget);

  if (submittedGuesses.length === 0) {
    throw new Error("Cannot build a result grid without submitted guesses.");
  }

  const rows = submittedGuesses.map((guess) =>
    Array.from({ length: wordLength }, (_, colIndex) => {
      const color = evaluateTileColor(guess, normalizedTarget, colIndex);
      return TILE_EMOJI[color] ?? TILE_EMOJI.absent;
    }).join(""),
  );

  return [
    buildHeader(submittedGuesses, normalizedTarget),
    ...rows,
    buildCallToAction(submittedGuesses, normalizedTarget),
  ].join("\n");
}
