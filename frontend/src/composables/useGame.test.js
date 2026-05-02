import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import { useSettingsStore } from "../stores/settingsStore";
import { useStatsStore } from "../stores/statsStore";
import { useGame, evaluateTileColor, validateHardModeGuess } from "./useGame";
import { LATEST_DICT_VERSION } from "../constants/dictionary";

const mockDictionary = {
  lion: { meanings: [] },
  crane: { meanings: [] },
  planet: { meanings: [] },
};

const mockAllowedGuesses = ["LION", "CRANE", "PLANET"].join("\n");

describe("evaluateTileColor", () => {
  it("marks exact matches as correct", () => {
    expect(evaluateTileColor("CRANE", "CRATE", 0)).toBe("correct");
    expect(evaluateTileColor("CRANE", "CRATE", 1)).toBe("correct");
  });

  it("handles duplicate letters without overcounting present tiles", () => {
    expect(evaluateTileColor("PUPPY", "APPLE", 0)).toBe("present");
    expect(evaluateTileColor("PUPPY", "APPLE", 2)).toBe("correct");
    expect(evaluateTileColor("PUPPY", "APPLE", 3)).toBe("absent");
  });

  it("returns absent for letters not in the target", () => {
    expect(evaluateTileColor("CRANE", "PILOT", 0)).toBe("absent");
  });
});

describe("validateHardModeGuess", () => {
  it("requires previously revealed green letters to stay fixed", () => {
    expect(validateHardModeGuess(["CIGAR"], "RABID", "CANDY")).toBe(
      "Position 1 must be C",
    );
  });

  it("requires previously revealed yellow letters to be reused", () => {
    expect(validateHardModeGuess(["ROAST"], "CYNIC", "CANDY")).toBe(
      "Guess must contain A",
    );
  });

  it("allows guesses that satisfy all revealed hints", () => {
    expect(validateHardModeGuess(["CIGAR", "ROAST"], "CARGO", "CANDY")).toBe("");
  });
});

describe("useGame word length handling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    setActivePinia(createPinia());
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        if (url.includes(`target-dictionary-v${LATEST_DICT_VERSION}.json`)) {
          return {
            ok: true,
            json: async () => mockDictionary,
          };
        }

        if (url.includes(`allowed-guesses-v${LATEST_DICT_VERSION}.txt`)) {
          return {
            ok: true,
            text: async () => mockAllowedGuesses,
          };
        }

        if (
          url.includes("target-dictionary-v2.json") ||
          url.includes("allowed-guesses-v2.txt")
        ) {
          return {
            ok: false,
            status: 404,
          };
        }

        if (url.includes("/events/")) {
          return { ok: true };
        }

        throw new Error(`Unexpected fetch: ${url}`);
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses the active word length for grid sizing and stats even when settings differ", async () => {
    const settingsStore = useSettingsStore();
    const statsStore = useStatsStore();
    const game = useGame();

    await game.fetchDictionary();

    expect(settingsStore.wordLength).toBe(5);
    expect(game.wordLength.value).toBe(5);

    game.activeWordLength.value = 4;
    game.targetWord.value = "LION";
    game.guesses.value = ["LION", "", "", "", "", ""];
    game.currentRow.value = 0;

    expect(settingsStore.wordLength).toBe(5);
    expect(game.wordLength.value).toBe(4);
    expect(game.gridStyle.value["--cols"]).toBe(4);

    game.handleKeyClick("Enter");
    vi.advanceTimersByTime(1000);
    await nextTick();

    expect(game.gameState.value).toBe("won");
    expect(statsStore.gamesWon).toBe(1);
    expect(statsStore.winsBy4Letter).toBe(1);
    expect(statsStore.winsBy5Letter).toBe(0);
  });

  it("resets the active word length back to the saved setting for a normal new game", async () => {
    const settingsStore = useSettingsStore();
    const game = useGame();

    await game.fetchDictionary();

    game.activeWordLength.value = 4;
    expect(game.wordLength.value).toBe(4);

    settingsStore.setWordLength(6);
    await game.resetGame();

    expect(settingsStore.wordLength).toBe(6);
    expect(game.wordLength.value).toBe(6);
    expect(game.gridStyle.value["--cols"]).toBe(6);
  });

  it("loads the latest dictionary version into the same word buckets as before", async () => {
    const game = useGame();

    const data = await game.loadDictionaryVersion(LATEST_DICT_VERSION);

    expect(data.dictionary).toEqual(mockDictionary);
    expect(data.allowedGuesses).toEqual({
      4: ["LION"],
      5: ["CRANE"],
      6: ["PLANET"],
    });
    expect(data.answerWords).toEqual({
      4: ["LION"],
      5: ["CRANE"],
      6: ["PLANET"],
    });
  });

  it("surfaces a clear error when a dictionary version is missing", async () => {
    const game = useGame();

    await expect(game.loadDictionaryVersion(2)).rejects.toThrow(
      "Dictionary version 2 is unavailable.",
    );
  });

  it("tracks the deterministic seed used for the active random game", async () => {
    localStorage.setItem("freedle_client_id", "test-client");
    vi.spyOn(Math, "random").mockReturnValue(0.25);

    const game = useGame();

    await game.fetchDictionary();

    expect(game.isDailyGame.value).toBe(false);
    expect(game.currentRandomSeed.value).toBe(1073741824);
  });

  it("clears the random seed and exposes a shareable date for daily games", async () => {
    const game = useGame();

    await game.fetchDictionary();
    await game.resetGame(true);

    expect(game.currentRandomSeed.value).toBeNull();
    expect(game.currentDailyDate.value).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
  });
});
