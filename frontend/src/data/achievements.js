/**
 * Achievements definitions for Freedle
 * Each achievement has an id, name, description, icon, and condition function
 */

export const achievements = [
  // Win-based achievements
  {
    id: "first_win",
    name: "First Victory",
    description: "Win your first game",
    icon: "🏆",
    condition: (stats) => stats.gamesWon >= 1,
  },
  {
    id: "wins_10",
    name: "Getting Started",
    description: "Win 10 games",
    icon: "⭐",
    condition: (stats) => stats.gamesWon >= 10,
  },
  {
    id: "wins_50",
    name: "Veteran",
    description: "Win 50 games",
    icon: "🌟",
    condition: (stats) => stats.gamesWon >= 50,
  },
  {
    id: "wins_100",
    name: "Master",
    description: "Win 100 games",
    icon: "👑",
    condition: (stats) => stats.gamesWon >= 100,
  },

  // Streak-based achievements
  {
    id: "streak_3",
    name: "On Fire",
    description: "Win 3 games in a row",
    icon: "🔥",
    condition: (stats) => stats.maxStreak >= 3,
  },
  {
    id: "streak_5",
    name: "Unstoppable",
    description: "Win 5 games in a row",
    icon: "💪",
    condition: (stats) => stats.maxStreak >= 5,
  },
  {
    id: "streak_10",
    name: "Legendary",
    description: "Win 10 games in a row",
    icon: "🌈",
    condition: (stats) => stats.maxStreak >= 10,
  },

  // Guess-based achievements
  {
    id: "guess_1",
    name: "Lucky Guess",
    description: "Win on the first guess",
    icon: "🍀",
    condition: (stats) => stats.guessDistribution[1] >= 1,
  },
  {
    id: "guess_2",
    name: "Sharp Mind",
    description: "Win on the second guess",
    icon: "🧠",
    condition: (stats) => stats.guessDistribution[2] >= 1,
  },
  {
    id: "guess_6",
    name: "Close Call",
    description: "Win on the last guess",
    icon: "😅",
    condition: (stats) => stats.guessDistribution[6] >= 1,
  },

  // Difficulty-based achievements
  {
    id: "win_4_letter",
    name: "Short & Sweet",
    description: "Win with a 4-letter word",
    icon: "4️⃣",
    condition: (stats) => stats.winsBy4Letter >= 1,
  },
  {
    id: "win_5_letter",
    name: "Classic",
    description: "Win with a 5-letter word",
    icon: "5️⃣",
    condition: (stats) => stats.winsBy5Letter >= 1,
  },
  {
    id: "win_6_letter",
    name: "Challenge Mode",
    description: "Win with a 6-letter word",
    icon: "6️⃣",
    condition: (stats) => stats.winsBy6Letter >= 1,
  },

  // Volume-based achievements
  {
    id: "played_25",
    name: "Wordsmith",
    description: "Play 25 games",
    icon: "📚",
    condition: (stats) => stats.gamesPlayed >= 25,
  },
  {
    id: "played_100",
    name: "Dedicated",
    description: "Play 100 games",
    icon: "🫶",
    condition: (stats) => stats.gamesPlayed >= 100,
  },
  {
    id: "played_250",
    name: "Addicted",
    description: "Play 250 games",
    icon: "♠",
    condition: (stats) => stats.gamesPlayed >= 250,
  },
  {
    id: "played_500",
    name: "Obsessed",
    description: "Play 500 games",
    icon: "💎",
    condition: (stats) => stats.gamesPlayed >= 500,
  },

  // Mode-based achievements
  {
    id: "win_hard_mode",
    name: "Hardcore",
    description: "Win a game with Hard Mode enabled",
    icon: "💀",
    condition: (stats) => stats.winsByHardMode >= 1,
  },
  {
    id: "win_count_mode",
    name: "Counting Cards",
    description: "Win a game with Count Mode enabled",
    icon: "🔢",
    condition: (stats) => stats.winsByCountMode >= 1,
  },
];

/**
 * Get achievement by ID
 */
export function getAchievementById(id) {
  return achievements.find((a) => a.id === id);
}

/**
 * Check which achievements are newly unlocked
 * @param {Object} stats - Current stats object
 * @param {Array} unlockedIds - Array of already unlocked achievement IDs
 * @returns {Array} Array of newly unlocked achievement objects
 */
export function checkNewAchievements(stats, unlockedIds) {
  return achievements.filter(
    (achievement) =>
      !unlockedIds.includes(achievement.id) && achievement.condition(stats)
  );
}
