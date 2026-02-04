<script setup>
import { computed, ref } from "vue";

const start = ref(new Date().toISOString().slice(0, 10));
const max = ref(1000);

const loading = ref(false);
const error = ref("");
const events = ref([]);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const url = new URL("/api/events", window.location.origin);
    url.searchParams.set("start", start.value);
    url.searchParams.set("max", String(max.value));

    const res = await fetch(url);
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || `Request failed (${res.status})`);
    }

    events.value = data.events || [];
  } catch (e) {
    error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
}

const summary = computed(() => {
  const total = events.value.length;
  const gameStarts = events.value.filter((e) => e?.type === "game_start").length;
  return { total, gameStarts };
});
</script>

<template>
  <main style="font-family: system-ui, sans-serif; padding: 16px; max-width: 1000px; margin: 0 auto">
    <h1>Freedle Admin</h1>

    <section style="display: flex; gap: 12px; align-items: end; flex-wrap: wrap">
      <label>
        Start (YYYY-MM-DD)
        <input v-model="start" type="date" />
      </label>

      <label>
        Max
        <input v-model.number="max" type="number" min="1" step="100" />
      </label>

      <button @click="load" :disabled="loading">Load</button>
    </section>

    <p v-if="loading">Loading…</p>
    <p v-else-if="error" style="color: #b00020">{{ error }}</p>

    <section v-if="!loading && !error" style="margin-top: 12px">
      <div style="display: flex; gap: 16px; flex-wrap: wrap">
        <div><b>Total events:</b> {{ summary.total }}</div>
        <div><b>Game starts:</b> {{ summary.gameStarts }}</div>
      </div>

      <details style="margin-top: 12px">
        <summary>Raw events ({{ events.length }})</summary>
        <pre style="white-space: pre-wrap">{{ JSON.stringify(events, null, 2) }}</pre>
      </details>
    </section>
  </main>
</template>
