<template>
  <div
    :class="[
      'letter-tile',
      color,
      { 'has-letter': letter && isCurrentRow, flip: flip },
    ]"
    :style="{ animationDelay: delay }"
  >
    {{ letter }}
    <span v-if="count > 1" class="count-badge">{{ count }}</span>
  </div>
</template>

<script setup>
defineProps({
  letter: {
    type: String,
    default: "",
  },
  color: {
    type: String,
    default: "idle", // 'correct', 'present', 'absent', 'idle'
  },
  delay: {
    type: String,
    default: "0ms",
  },
  count: {
    type: Number,
    default: 0,
  },
  flip: {
    type: Boolean,
    default: true,
  },
  isCurrentRow: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.letter-tile {
  position: relative;
  width: 80px;
  height: 80px;
  color: var(--text-on-accent);
  border: 2px solid var(--state-absent-border);
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

/* When not animating, show color immediately */
.correct:not(.flip) {
  border: 0 solid transparent;
  background: var(--state-correct-gradient);
}

.present:not(.flip) {
  border: 0 solid transparent;
  background: var(--state-present-gradient);
}

.absent:not(.flip) {
  border: 0 solid transparent;
  background: var(--state-absent-gradient);
}

/* When animating, use flip animation which handles the color reveal */
.correct.flip {
  animation: flip-correct 0.6s ease-in forwards;
}

.present.flip {
  animation: flip-present 0.6s ease-in forwards;
}

.absent.flip {
  animation: flip-absent 0.6s ease-in forwards;
}

.idle {
  background-color: transparent;
}

/* Animations */
@keyframes pop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes flip-correct {
  0% {
    transform: rotateX(0);
    background: transparent;
    border-color: var(--state-absent-border);
  }
  45% {
    transform: rotateX(90deg);
    background: transparent;
    border-color: var(--state-absent-border);
  }
  55% {
    transform: rotateX(90deg);
    background: var(--state-correct-gradient);
    border: 0 solid transparent;
  }
  100% {
    transform: rotateX(0);
    background: var(--state-correct-gradient);
    border: 0 solid transparent;
  }
}

@keyframes flip-present {
  0% {
    transform: rotateX(0);
    background: transparent;
    border-color: var(--state-absent-border);
  }
  45% {
    transform: rotateX(90deg);
    background: transparent;
    border-color: var(--state-absent-border);
  }
  55% {
    transform: rotateX(90deg);
    background: var(--state-present-gradient);
    border: 0 solid transparent;
  }
  100% {
    transform: rotateX(0);
    background: var(--state-present-gradient);
    border: 0 solid transparent;
  }
}

@keyframes flip-absent {
  0% {
    transform: rotateX(0);
    background: transparent;
    border-color: var(--state-absent-border);
  }
  45% {
    transform: rotateX(90deg);
    background: transparent;
    border-color: var(--state-absent-border);
  }
  55% {
    transform: rotateX(90deg);
    background: var(--state-absent-gradient);
    border: 0 solid transparent;
  }
  100% {
    transform: rotateX(0);
    background: var(--state-absent-gradient);
    border: 0 solid transparent;
  }
}

.count-badge {
  position: absolute;
  bottom: 2px;
  right: 3px;
  background: var(--surface-scrim);
  color: var(--text-on-accent);
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

@media (max-width: 505px), (max-height: 925px) {
  .letter-tile {
    width: 70px;
    height: 70px;
    font-size: 2.3rem;
  }
}

@media (max-width: 445px), (max-height: 862px) {
  .letter-tile {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }
}

@media (max-width: 385px), (max-height: 802px) {
  .letter-tile {
    width: 50px;
    height: 50px;
    font-size: 1.2rem;
    border-width: 1px;
  }
}

@media (max-width: 325px), (max-height: 742px) {
  .letter-tile {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
    border-width: 1px;
  }
}
</style>
