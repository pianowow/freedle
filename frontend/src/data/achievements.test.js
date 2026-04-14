import {
  checkNewAchievements,
  getAchievementById,
} from "./achievements";

describe("achievements", () => {
  it("looks up achievements by id", () => {
    expect(getAchievementById("first_win")?.name).toBe("First Victory");
    expect(getAchievementById("missing")).toBeUndefined();
  });

  it("returns only newly unlocked achievements", () => {
    const unlocked = checkNewAchievements(
      {
        gamesPlayed: 25,
        gamesWon: 10,
        gamesLost: 15,
        currentStreak: 4,
        maxStreak: 4,
        guessDistribution: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0 },
        winsBy4Letter: 1,
        winsBy5Letter: 0,
        winsBy6Letter: 0,
        winsByHardMode: 0,
        winsByCountMode: 0,
      },
      ["first_win", "streak_3"],
    );

    expect(unlocked.map((achievement) => achievement.id)).toEqual([
      "wins_10",
      "guess_2",
      "win_4_letter",
      "played_25",
    ]);
  });
});
