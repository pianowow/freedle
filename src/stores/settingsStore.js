import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'freedle-settings'

export const useSettingsStore = defineStore('settings', () => {
    // Load initial state from localStorage
    const savedSettings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')

    // Settings state
    const wordLength = ref(savedSettings.wordLength ?? 5)
    const hardMode = ref(savedSettings.hardMode ?? false)
    const countMode = ref(savedSettings.countMode ?? false)

    // Save to localStorage whenever state changes
    function saveToStorage() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            wordLength: wordLength.value,
            hardMode: hardMode.value,
            countMode: countMode.value
        }))
    }

    // Watch for changes and persist
    watch([wordLength, hardMode, countMode], saveToStorage, { deep: true })

    // Actions
    function setWordLength(len) {
        if ([4, 5, 6].includes(len)) {
            wordLength.value = len
        }
    }

    function setHardMode(enabled) {
        hardMode.value = enabled
    }

    function setCountMode(enabled) {
        countMode.value = enabled
    }

    return {
        wordLength,
        hardMode,
        countMode,
        setWordLength,
        setHardMode,
        setCountMode
    }
})
