import { buildResultGrid } from "./resultGrid";
import { buildDailyShareUrl, buildRandomShareUrl } from "./shareLink";

export async function buildShareUrlForGame({
  isDailyGame,
  currentDictionaryVersion,
  currentDailyDate,
  currentRandomSeed,
  targetWord,
}) {
  if (isDailyGame) {
    if (!currentDailyDate) {
      throw new Error("Daily share date is unavailable.");
    }

    return buildDailyShareUrl({
      version: currentDictionaryVersion,
      date: currentDailyDate,
      word: targetWord,
    });
  }

  if (!Number.isInteger(currentRandomSeed)) {
    throw new Error("Random share seed is unavailable.");
  }

  return buildRandomShareUrl({
    version: currentDictionaryVersion,
    seed: currentRandomSeed,
    word: targetWord,
  });
}

export async function buildShareText({
  guesses,
  targetWord,
  wordLength,
  isDailyGame,
  currentDictionaryVersion,
  currentDailyDate,
  currentRandomSeed,
}) {
  const [resultGrid, shareUrl] = await Promise.all([
    buildResultGrid({
      guesses,
      target: targetWord,
      wordLength,
    }),
    buildShareUrlForGame({
      isDailyGame,
      currentDictionaryVersion,
      currentDailyDate,
      currentRandomSeed,
      targetWord,
    }),
  ]);

  return `${resultGrid}\n${shareUrl}`;
}

export async function copyTextToClipboard(
  text,
  {
    clipboard = globalThis.navigator?.clipboard,
    documentRef = globalThis.document,
  } = {},
) {
  if (clipboard?.writeText) {
    await clipboard.writeText(text);
    return;
  }

  if (!documentRef?.createElement || !documentRef.body) {
    throw new Error("Clipboard unavailable.");
  }

  const textarea = documentRef.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";

  documentRef.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const copied = typeof documentRef.execCommand === "function" &&
    documentRef.execCommand("copy");

  documentRef.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Clipboard unavailable.");
  }
}
