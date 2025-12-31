import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { achievements, checkNewAchievements } from '../data/achievements'

const STORAGE_KEY = 'freedle-stats'

export const useStatsStore = defineStore('stats', () => {
    // Load initial state from localStorage
    const savedStats = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')

    // Stats state
    const gamesPlayed = ref(savedStats.gamesPlayed ?? 0)
    const gamesWon = ref(savedStats.gamesWon ?? 0)
    const gamesLost = ref(savedStats.gamesLost ?? 0)
    const currentStreak = ref(savedStats.currentStreak ?? 0)
    const maxStreak = ref(savedStats.maxStreak ?? 0)

    // Guess distribution (1-6 guesses)
    const guessDistribution = ref(savedStats.guessDistribution ?? {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0
    })

    // Wins by word length
    const winsBy4Letter = ref(savedStats.winsBy4Letter ?? 0)
    const winsBy5Letter = ref(savedStats.winsBy5Letter ?? 0)
    const winsBy6Letter = ref(savedStats.winsBy6Letter ?? 0)

    // Wins by mode
    const winsByHardMode = ref(savedStats.winsByHardMode ?? 0)
    const winsByCountMode = ref(savedStats.winsByCountMode ?? 0)

    // Unlocked achievement IDs
    const unlockedAchievements = ref(savedStats.unlockedAchievements ?? [])

    // Recently unlocked achievements (for notifications, not persisted)
    const recentlyUnlocked = ref([])

    // Computed values
    const winPercentage = computed(() => {
        if (gamesPlayed.value === 0) return 0
        return Math.round((gamesWon.value / gamesPlayed.value) * 100)
    })

    // Save to localStorage whenever state changes
    function saveToStorage() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            gamesPlayed: gamesPlayed.value,
            gamesWon: gamesWon.value,
            gamesLost: gamesLost.value,
            currentStreak: currentStreak.value,
            maxStreak: maxStreak.value,
            guessDistribution: guessDistribution.value,
            winsBy4Letter: winsBy4Letter.value,
            winsBy5Letter: winsBy5Letter.value,
            winsBy6Letter: winsBy6Letter.value,
            winsByHardMode: winsByHardMode.value,
            winsByCountMode: winsByCountMode.value,
            unlockedAchievements: unlockedAchievements.value
        }))
    }

    // Watch for changes and persist
    watch(
        [gamesPlayed, gamesWon, gamesLost, currentStreak, maxStreak, guessDistribution,
            winsBy4Letter, winsBy5Letter, winsBy6Letter, unlockedAchievements],
        saveToStorage,
        { deep: true }
    )

    // Get stats object for achievement checking
    function getStatsObject() {
        return {
            gamesPlayed: gamesPlayed.value,
            gamesWon: gamesWon.value,
            gamesLost: gamesLost.value,
            currentStreak: currentStreak.value,
            maxStreak: maxStreak.value,
            guessDistribution: guessDistribution.value,
            winsBy4Letter: winsBy4Letter.value,
            winsBy5Letter: winsBy5Letter.value,
            winsBy6Letter: winsBy6Letter.value,
            winsByHardMode: winsByHardMode.value,
            winsByCountMode: winsByCountMode.value
        }
    }

    // Check and unlock new achievements
    function checkAchievements() {
        const newlyUnlocked = checkNewAchievements(
            getStatsObject(),
            unlockedAchievements.value
        )

        if (newlyUnlocked.length > 0) {
            // Add newly unlocked achievement IDs
            newlyUnlocked.forEach(achievement => {
                unlockedAchievements.value.push(achievement.id)
            })
            // Set recently unlocked for notification display
            recentlyUnlocked.value = newlyUnlocked
        }

        return newlyUnlocked
    }

    // Clear recently unlocked (after showing notification)
    function clearRecentlyUnlocked() {
        recentlyUnlocked.value = []
    }

    // Record a win
    function recordWin(guessCount, wordLength, modes = {}) {
        gamesPlayed.value++
        gamesWon.value++
        currentStreak.value++

        if (currentStreak.value > maxStreak.value) {
            maxStreak.value = currentStreak.value
        }

        // Update guess distribution
        if (guessCount >= 1 && guessCount <= 6) {
            guessDistribution.value[guessCount]++
        }

        // Update wins by word length
        if (wordLength === 4) winsBy4Letter.value++
        else if (wordLength === 5) winsBy5Letter.value++
        else if (wordLength === 6) winsBy6Letter.value++

        // Update wins by mode
        if (modes.hardMode) winsByHardMode.value++
        if (modes.countMode) winsByCountMode.value++

        // Check for new achievements
        return checkAchievements()
    }

    // Record a loss
    function recordLoss() {
        gamesPlayed.value++
        gamesLost.value++
        currentStreak.value = 0

        // Check for new achievements (volume-based)
        return checkAchievements()
    }

    // Get all achievements with their unlock status
    const allAchievements = computed(() => {
        return achievements.map(achievement => ({
            ...achievement,
            unlocked: unlockedAchievements.value.includes(achievement.id)
        }))
    })

    // Count of unlocked achievements
    const unlockedCount = computed(() => unlockedAchievements.value.length)
    const totalAchievements = computed(() => achievements.length)

    return {
        // State
        gamesPlayed,
        gamesWon,
        gamesLost,
        currentStreak,
        maxStreak,
        guessDistribution,
        winsBy4Letter,
        winsBy5Letter,
        winsBy6Letter,
        unlockedAchievements,
        recentlyUnlocked,

        // Computed
        winPercentage,
        allAchievements,
        unlockedCount,
        totalAchievements,

        // Actions
        recordWin,
        recordLoss,
        checkAchievements,
        clearRecentlyUnlocked
    }
})
