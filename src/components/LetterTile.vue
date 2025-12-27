<template>
  <div :class="['letter-tile', color]">
    {{ letter }}
  </div>
</template>

<script setup>
defineProps({
  letter: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: 'idle' // 'correct', 'present', 'absent', 'idle'
  }
});
</script>

<style scoped>
.letter-tile {
  width: 60px;
  height: 60px;
  border: 2px solid #3a3a3c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  text-transform: uppercase;
  user-select: none;
  transition: all 0.2s ease-in-out;
  border-radius: 4px;
}

.correct {
  background-color: #538d4e;
  border-color: #538d4e;
  color: white;
}

.present {
  background-color: #b59f3b;
  border-color: #b59f3b;
  color: white;
}

.absent {
  background-color: #3a3a3c;
  border-color: #3a3a3c;
  color: white;
}

.idle {
  background-color: transparent;
  color: white;
}

@media (max-width: 480px) {
  .letter-tile {
    width: 45px;
    height: 45px;
    font-size: 1.5rem;
  }
}
</style>
