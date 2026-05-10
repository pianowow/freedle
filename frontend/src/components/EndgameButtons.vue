<template>
  <div class="endgame-actions">
    <button
      class="share-btn endgame-action-btn"
      title="Share a link to this game"
      aria-label="Share a link to this game"
      :disabled="isSharing"
      @click="handleShare"
    >
      <span class="share-btn-icon" :aria-hidden="true">{{
        isSharing ? "…" : "↗"
      }}</span>
    </button>

    <button class="new-game-btn endgame-action-btn" @click="$emit('new-game')">
      New Game
    </button>

    <BaseToast :show="showToast" variant="info">
      <template #icon>{{ toastIcon }}</template>
      <template #title>{{ toastTitle }}</template>
      <template #message>{{ toastMessage }}</template>
    </BaseToast>
  </div>
</template>

<script setup>
import { onUnmounted, ref } from "vue";
import BaseToast from "./BaseToast.vue";
import { buildShareText, copyTextToClipboard } from "../utils/shareText";

const props = defineProps({
  guesses: {
    type: Array,
    required: true,
  },
  targetWord: {
    type: String,
    required: true,
  },
  wordLength: {
    type: Number,
    required: true,
  },
  isDailyGame: {
    type: Boolean,
    required: true,
  },
  currentDictionaryVersion: {
    type: Number,
    required: true,
  },
  currentDailyDate: {
    type: String,
    default: "",
  },
  currentRandomSeed: {
    type: [Number, null],
    default: null,
  },
});

defineEmits(["new-game"]);

const isSharing = ref(false);
const showToast = ref(false);
const toastTitle = ref("");
const toastMessage = ref("");
const toastIcon = ref("🔗");

let toastTimerId = null;

function showStatusToast({ title, message, icon = "🔗", duration = 2200 }) {
  toastTitle.value = title;
  toastMessage.value = message;
  toastIcon.value = icon;
  showToast.value = true;

  if (toastTimerId !== null) {
    clearTimeout(toastTimerId);
  }

  toastTimerId = window.setTimeout(() => {
    showToast.value = false;
    toastTimerId = null;
  }, duration);
}

async function shareWithFallback(text) {
  if (typeof globalThis.navigator?.share === "function") {
    try {
      await globalThis.navigator.share({ text });
      return;
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }
    }
  }

  await copyTextToClipboard(text);
  showStatusToast({
    title: "Copied!",
    message: "Grid colors and link copied to clipboard.",
    icon: "📋",
  });
}

async function handleShare() {
  if (isSharing.value) {
    return;
  }

  isSharing.value = true;

  try {
    const text = await buildShareText({
      guesses: props.guesses,
      targetWord: props.targetWord,
      wordLength: props.wordLength,
      isDailyGame: props.isDailyGame,
      currentDictionaryVersion: props.currentDictionaryVersion,
      currentDailyDate: props.currentDailyDate,
      currentRandomSeed: props.currentRandomSeed,
    });

    await shareWithFallback(text);
  } catch (error) {
    console.error("Failed to share game", error);
    showStatusToast({
      title: "Share unavailable",
      message: "Could not build or copy this share link.",
      icon: "⚠️",
      duration: 3000,
    });
  } finally {
    isSharing.value = false;
  }
}

onUnmounted(() => {
  if (toastTimerId !== null) {
    clearTimeout(toastTimerId);
  }
});
</script>

<style scoped>
.endgame-actions {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 10px;
}

.endgame-action-btn {
  height: 56px;
  background: var(--state-correct-gradient);
  color: var(--text-on-accent);
  border: none;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.endgame-action-btn:hover:not(:disabled) {
  background: var(--state-correct-gradient-hover);
}

.share-btn {
  width: 56px;
  padding: 0;
  font-size: 1.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  flex-shrink: 0;
}

.share-btn:hover:not(:disabled),
.new-game-btn:hover {
  transform: translateY(-1px);
}

.share-btn:disabled {
  cursor: wait;
  opacity: 0.8;
}

.share-btn-icon {
  display: inline-block;
  font-size: 2.15rem;
  line-height: 0.9;
  transform: translate(1px, -1px);
}

.new-game-btn {
  font-size: 1.5rem;
  padding: 0 24px;
  margin: 0;
  flex: 1;
  width: auto;
}

</style>
