<template>
  <BaseModal :show="show" title="Statistics" @close="$emit('close')">
    <div class="stats-content">
      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">{{ statsStore.gamesPlayed }}</span>
          <span class="stat-label">Played</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ statsStore.winPercentage }}</span>
          <span class="stat-label">Win %</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ statsStore.currentStreak }}</span>
          <span class="stat-label">Current Streak</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ statsStore.maxStreak }}</span>
          <span class="stat-label">Max Streak</span>
        </div>
      </div>

      <!-- Guess Distribution -->
      <div class="distribution-section">
        <h3>Guess Distribution</h3>
        <div class="distribution-chart">
          <div 
            v-for="num in 6" 
            :key="num" 
            class="distribution-row"
          >
            <span class="guess-num">{{ num }}</span>
            <div class="bar-container">
              <div 
                class="bar" 
                :style="{ width: getBarWidth(num) }"
                :class="{ 'has-value': statsStore.guessDistribution[num] > 0 }"
              >
                <span class="bar-value">{{ statsStore.guessDistribution[num] }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Achievements Section -->
      <div class="achievements-section">
        <h3>
          Achievements 
          <span class="achievement-count">
            ({{ statsStore.unlockedCount }}/{{ statsStore.totalAchievements }})
          </span>
        </h3>
        <div class="achievements-grid">
          <div 
            v-for="achievement in statsStore.allAchievements" 
            :key="achievement.id"
            class="achievement-item"
            :class="{ unlocked: achievement.unlocked }"
          >
            <span class="achievement-icon">
              {{ achievement.unlocked ? achievement.icon : '🔒' }}
            </span>
            <div class="achievement-info">
              <span class="achievement-name">{{ achievement.name }}</span>
              <span class="achievement-desc">{{ achievement.description }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { computed } from 'vue'
import BaseModal from './BaseModal.vue'
import { useStatsStore } from '../stores/statsStore'

defineProps({
  show: {
    type: Boolean,
    required: true
  }
})

defineEmits(['close'])

const statsStore = useStatsStore()

// Calculate the maximum value for bar scaling
const maxGuesses = computed(() => {
  return Math.max(...Object.values(statsStore.guessDistribution), 1)
})

function getBarWidth(guessNum) {
  const value = statsStore.guessDistribution[guessNum]
  if (value === 0) return '0%'
  const percentage = (value / maxGuesses.value) * 100
  return `${Math.max(percentage, 8)}%` // Minimum 8% width when there's a value
}
</script>

<style scoped>
.stats-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  text-align: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #ffffff;
}

.stat-label {
  font-size: 0.75rem;
  color: #818384;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Distribution Section */
.distribution-section h3,
.achievements-section h3 {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #a0a0a0;
  margin: 0 0 12px 0;
  font-weight: 600;
}

.achievement-count {
  font-weight: 400;
  color: #538d4e;
}

.distribution-chart {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.distribution-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.guess-num {
  width: 16px;
  font-weight: 700;
  color: #a0a0a0;
  text-align: right;
}

.bar-container {
  flex: 1;
  height: 24px;
  position: relative;
}

.bar {
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 8px;
  min-width: 24px;
  transition: width 0.5s ease-out;
}

.bar.has-value {
  background: linear-gradient(135deg, #538d4e 0%, #60a15a 100%);
}

.bar-value {
  font-size: 0.8rem;
  font-weight: 700;
  color: white;
}

/* Achievements Section */
.achievements-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 250px;
  overflow-y: auto;
  padding-right: 4px;
}

.achievements-grid::-webkit-scrollbar {
  width: 4px;
}

.achievements-grid::-webkit-scrollbar-thumb {
  background-color: #538d4e;
  border-radius: 10px;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
}

.achievement-item.unlocked {
  background: rgba(83, 141, 78, 0.1);
  border-color: rgba(83, 141, 78, 0.2);
}

.achievement-item:not(.unlocked) {
  opacity: 0.5;
}

.achievement-icon {
  font-size: 1.5rem;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.achievement-item.unlocked .achievement-icon {
  background: rgba(83, 141, 78, 0.2);
}

.achievement-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.achievement-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #ffffff;
}

.achievement-item:not(.unlocked) .achievement-name {
  color: #818384;
}

.achievement-desc {
  font-size: 0.8rem;
  color: #818384;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Responsive */
@media (max-width: 400px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
}
</style>
