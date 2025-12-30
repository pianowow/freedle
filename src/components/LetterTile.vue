<template>
  <div 
    :class="['letter-tile', color, { 'has-letter': letter }]"
    :style="{ animationDelay: delay }"
  >
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
  },
  delay: {
    type: String,
    default: '0ms'
  }
});
</script>

<style scoped>
.letter-tile {
  width: 80px;
  height: 80px;
  border: 2px solid #3a3a3c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
  text-transform: uppercase;
  user-select: none;
  border-radius: 4px;
  backface-visibility: hidden;
  transition: border-color 0.2s;
}

.has-letter {
  border-color: #565758;
  animation: pop 0.1s linear 1;
}

.correct {
  background-color: #538d4e;
  border-color: #538d4e;
  color: white;
  animation: flip 0.6s ease-in forwards;
}

.present {
  background-color: #b59f3b;
  border-color: #b59f3b;
  color: white;
  animation: flip 0.6s ease-in forwards;
}

.absent {
  background-color: #3a3a3c;
  border-color: #3a3a3c;
  color: white;
  animation: flip 0.6s ease-in forwards;
}

.idle {
  background-color: transparent;
  color: white;
}

/* Animations */
@keyframes pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes flip {
  0% {
    transform: rotateX(0);
    background-color: transparent;
    border-color: #3a3a3c;
  }
  45% {
    transform: rotateX(90deg);
    background-color: transparent;
    border-color: #3a3a3c;
  }
  55% {
    transform: rotateX(90deg);
  }
  100% {
    transform: rotateX(0);
  }
}

.winner {
  animation: bounce 0.5s ease-in-out;
}

@keyframes bounce {
  0%, 20% { transform: translateY(0); }
  40% { transform: translateY(-20px); }
  50% { transform: translateY(5px); }
  60% { transform: translateY(-10px); }
  80% { transform: translateY(2px); }
  100% { transform: translateY(0); }
}

@media (max-width: 480px), (max-height: 800px) {
  .letter-tile {
    width: 48px;
    height: 48px;
    font-size: 1.6rem;
  }
}

@media (max-height: 700px) {
  .letter-tile {
    width: 42px;
    height: 42px;
    font-size: 1.4rem;
  }
}

@media (max-height: 600px) {
  .letter-tile {
    width: 36px;
    height: 36px;
    font-size: 1.2rem;
    border-width: 1px;
  }
}
</style>
