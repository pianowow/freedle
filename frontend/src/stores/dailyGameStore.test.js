import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import { useDailyGameStore } from "./dailyGameStore";

describe("dailyGameStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-14T12:00:00Z"));
    localStorage.clear();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("saves, loads, and clears daily game state by word length", async () => {
    const store = useDailyGameStore();
    const state = {
      guesses: ["CRANE", "", "", "", "", ""],
      currentRow: 1,
      gameState: "playing",
      targetWord: "CANDY",
      targetMeanings: [],
      keyStatuses: { C: "correct" },
      hardMode: false,
    };

    store.saveGameState(5, state);
    await nextTick();

    expect(store.getGameState(5)).toEqual(state);
    expect(store.isCompleted(5)).toBe(false);

    store.clearGameState(5);
    expect(store.getGameState(5)).toBeNull();
  });

  it("drops stale saved games from previous days", () => {
    localStorage.setItem(
      "freedle-daily-game",
      JSON.stringify({
        dateKey: 20260413,
        games: {
          5: { gameState: "won", targetWord: "OLDER" },
        },
      }),
    );
    setActivePinia(createPinia());

    const store = useDailyGameStore();

    expect(store.dateKey).toBe(20260414);
    expect(store.getGameState(5)).toBeNull();
  });

  it("reports completed games for wins and losses", () => {
    const store = useDailyGameStore();

    store.saveGameState(4, { gameState: "won" });
    store.saveGameState(6, { gameState: "lost" });

    expect(store.isCompleted(4)).toBe(true);
    expect(store.isCompleted(6)).toBe(true);
  });
});
