import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import { useStatsStore } from "./statsStore";

describe("statsStore", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it("records wins, unlocks achievements, and persists mode counters", async () => {
    const store = useStatsStore();

    const newlyUnlocked = store.recordWin(2, 4, {
      hardMode: true,
      countMode: true,
    });
    await nextTick();

    expect(store.gamesPlayed).toBe(1);
    expect(store.gamesWon).toBe(1);
    expect(store.currentStreak).toBe(1);
    expect(store.maxStreak).toBe(1);
    expect(store.guessDistribution[2]).toBe(1);
    expect(newlyUnlocked.map((achievement) => achievement.id)).toEqual([
      "first_win",
      "guess_2",
      "win_4_letter",
      "win_hard_mode",
      "win_count_mode",
    ]);

    expect(JSON.parse(localStorage.getItem("freedle-stats"))).toMatchObject({
      gamesPlayed: 1,
      gamesWon: 1,
      winsBy4Letter: 1,
      winsByHardMode: 1,
      winsByCountMode: 1,
    });
  });

  it("records losses and resets the current streak", async () => {
    localStorage.setItem(
      "freedle-stats",
      JSON.stringify({
        gamesPlayed: 3,
        gamesWon: 2,
        gamesLost: 1,
        currentStreak: 2,
        maxStreak: 2,
        guessDistribution: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 0, 6: 0 },
        winsBy4Letter: 0,
        winsBy5Letter: 2,
        winsBy6Letter: 0,
        winsByHardMode: 0,
        winsByCountMode: 0,
        unlockedAchievements: ["first_win"],
      }),
    );
    setActivePinia(createPinia());

    const store = useStatsStore();

    store.recordLoss();
    await nextTick();

    expect(store.gamesPlayed).toBe(4);
    expect(store.gamesLost).toBe(2);
    expect(store.currentStreak).toBe(0);
    expect(store.maxStreak).toBe(2);
  });
});
