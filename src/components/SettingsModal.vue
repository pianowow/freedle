<template>
  <BaseModal :show="show" title="Settings" @close="$emit('close')">
    <div class="settings-content">
      <!-- Word Length Setting -->
      <div class="setting-group">
        <div class="setting-label">
          <span class="setting-title">Word Length</span>
          <span class="setting-description">Choose the number of letters</span>
        </div>
        <div class="word-length-selector">
          <button 
            v-for="len in [4, 5, 6]" 
            :key="len" 
            :class="{ active: settingsStore.wordLength === len }"
            @click="handleWordLengthChange(len)"
          >
            {{ len }}
          </button>
        </div>
      </div>

      <!-- Hard Mode Setting -->
      <div :class="['setting-group', { 'disabled': isGameInProgress }]">
        <div class="setting-label">
          <span class="setting-title">Hard Mode</span>
          <span class="setting-description">Revealed hints must be used in subsequent guesses</span>
        </div>
        <div class="toggle-switch">
          <input 
            type="checkbox" 
            id="hard-mode" 
            :disabled="isGameInProgress"
            :checked="settingsStore.hardMode"
            @change="handleHardModeChange"
          />
          <label for="hard-mode"></label>
        </div>
      </div>

      <!-- Count Mode Setting -->
      <div class="setting-group">
        <div class="setting-label">
          <span class="setting-title">Count Mode</span>
          <span class="setting-description">Shows count on green tiles when letter appears multiple times</span>
        </div>
        <div class="toggle-switch">
          <input 
            type="checkbox" 
            id="count-mode" 
            :checked="settingsStore.countMode"
            @change="settingsStore.setCountMode($event.target.checked)"
          />
          <label for="count-mode"></label>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue'
import { useSettingsStore } from '../stores/settingsStore'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  isGameInProgress: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'word-length-change'])

const settingsStore = useSettingsStore()

function handleWordLengthChange(len) {
  if (len === settingsStore.wordLength) return
  
  if (props.isGameInProgress) {
    if (confirm('Change word length and restart game?')) {
      emit('word-length-change', len)
    }
  } else {
    emit('word-length-change', len)
  }
}

function handleHardModeChange(event) {
  if (props.isGameInProgress) {
    event.target.checked = settingsStore.hardMode
    return
  }
  settingsStore.setHardMode(event.target.checked)
}
</script>

<style scoped>
.settings-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.setting-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.setting-group.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.setting-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-title {
  font-weight: 600;
  font-size: 1rem;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-description {
  font-size: 0.85rem;
  color: #818384;
}

.coming-soon-badge {
  background: linear-gradient(135deg, #538d4e 0%, #60a15a 100%);
  color: white;
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
  text-transform: uppercase;
}

.word-length-selector {
  display: flex;
  gap: 8px;
}

.word-length-selector button {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #a0a0a0;
  padding: 10px 18px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.word-length-selector button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.word-length-selector button.active {
  background: linear-gradient(135deg, #538d4e 0%, #60a15a 100%);
  border-color: #538d4e;
  color: white;
  box-shadow: 0 4px 15px rgba(83, 141, 78, 0.3);
  transform: scale(1.05);
}

/* Toggle switch */
.toggle-switch {
  position: relative;
  width: 50px;
  height: 28px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch label {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 28px;
  transition: 0.3s;
}

.toggle-switch label::before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 3px;
  bottom: 3px;
  background-color: #a0a0a0;
  border-radius: 50%;
  transition: 0.3s;
}

.toggle-switch input:checked + label {
  background: linear-gradient(135deg, #538d4e 0%, #60a15a 100%);
}

.toggle-switch input:checked + label::before {
  transform: translateX(22px);
  background-color: white;
}
</style>
