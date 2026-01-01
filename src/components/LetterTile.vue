<template>
  <div 
    :class="['letter-tile', color, { 'has-letter': letter }]"
    :style="{ animationDelay: delay }"
  >
    {{ letter }}
    <span v-if="count > 1 && color === 'correct'" class="count-badge">{{ count }}</span>
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
  },
  count: {
    type: Number,
    default: 0
  }
});
</script>

<style scoped>
.letter-tile {
  width: 80px;
  height: 80px;
  color: white;
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
  animation: pop 0.1s linear 1;
}

.correct {
  border: 0px solid #0000;
  background: linear-gradient(rgba(110, 169, 94, 1), rgba(83, 125, 78, 1));
  animation: flip 0.6s ease-in forwards;
}

.present {
  border: 0px solid #0000;
  background: linear-gradient(rgb(217, 206, 85), rgb(128, 124, 3));
  animation: flip 0.6s ease-in forwards;
}

.absent {
  border: 0px solid #0000;
  background: linear-gradient(rgba(77, 77, 77, 1), rgba(38, 38, 38, 1));
  animation: flip 0.6s ease-in forwards;
}

.idle {
  background-color: transparent;
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

.count-badge {
  position: absolute;
  bottom: 2px;
  right: 3px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.letter-tile {
  position: relative;
}

@media (max-width: 480px), (max-height: 890px) {
  .letter-tile {
    width: 70px;
    height: 70px;
    font-size: 2.3rem;
  }
}

@media (max-height: 835px) {
  .letter-tile {
    width: 60px;
    height: 60px;
    font-size: 2.0rem;
  }
}

@media (max-height: 775px) {
  .letter-tile {
    width: 50px;
    height: 50px;
    font-size: 1.2rem;
    border-width: 1px;
  }
}
</style>
