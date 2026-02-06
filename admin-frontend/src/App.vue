<script setup>
import { computed, ref } from "vue";

const start = ref(new Date().toISOString().slice(0, 10));
const max = ref(1000);

const loading = ref(false);
const error = ref("");
const events = ref([]);

// Table filters
const q = ref("");
const typeFilter = ref("");
const ipFilter = ref("");

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

function formatEastern(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return new Intl.DateTimeFormat(undefined, {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);
}

function stringifyMultiline(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

const eventTypes = computed(() => {
  const s = new Set(events.value.map((e) => e?.type).filter(Boolean));
  return Array.from(s).sort();
});

const rows = computed(() => {
  const needle = q.value.trim().toLowerCase();
  const typeNeedle = typeFilter.value.trim().toLowerCase();
  const ipNeedle = ipFilter.value.trim().toLowerCase();

  return (events.value || [])
    .map((e, idx) => {
      const type = e?.type || "";
      const ip = e?.client?.ip || "";
      const ua = e?.client?.user_agent || "";
      const payload = e?.payload ?? null;
      const ts = e?.server_ts || "";

      return {
        _key: `${ts}-${idx}`,
        ts,
        tsEastern: formatEastern(ts),
        ip,
        ua,
        type,
        payload,
        payloadText: stringifyMultiline(payload),
      };
    })
    .filter((r) => {
      if (typeNeedle && r.type.toLowerCase() !== typeNeedle) return false;
      if (ipNeedle && !r.ip.toLowerCase().includes(ipNeedle)) return false;
      if (!needle) return true;

      const haystack = [r.ts, r.tsEastern, r.ip, r.type, r.ua, r.payloadText]
        .join("\n")
        .toLowerCase();
      return haystack.includes(needle);
    });
});
</script>

<template>
  <main class="app">
    <h1>Freedle Admin</h1>

    <section class="controls">
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
    <p v-else-if="error" class="error">{{ error }}</p>

    <section v-if="!loading && !error" class="content">
      <div class="summary">
        <div><b>Total events:</b> {{ events.length }}</div>
        <div><b>Showing:</b> {{ rows.length }}</div>
      </div>

      <section class="filters">
        <label class="field search">
          <span class="label">Search</span>
          <input
            v-model="q"
            placeholder="Search across time, ip, ua, type, payload…"
          />
        </label>

        <label class="field">
          <span class="label">Type</span>
          <select v-model="typeFilter">
            <option value="">All</option>
            <option v-for="t in eventTypes" :key="t" :value="t">{{ t }}</option>
          </select>
        </label>

        <label class="field">
          <span class="label">IP contains</span>
          <input v-model="ipFilter" placeholder="e.g. 192.168" />
        </label>

        <button
          class="btn"
          @click="
            () => {
              q = '';
              typeFilter = '';
              ipFilter = '';
            }
          "
        >
          Clear
        </button>
      </section>

      <div class="tableWrap">
        <table class="table">
          <thead>
            <tr>
              <th class="wTime">Server time (ET)</th>
              <th class="wIp">Client IP</th>
              <th class="wType">Type</th>
              <th class="wText">User Agent</th>
              <th class="wText">Payload</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="r in rows" :key="r._key">
              <td class="cellTop nowrap">
                <div>{{ r.tsEastern }}</div>
                <div class="muted small">{{ r.ts }}</div>
              </td>
              <td class="cellTop nowrap">
                {{ r.ip }}
              </td>
              <td class="cellTop nowrap">
                {{ r.type }}
              </td>
              <td class="cellTop">
                <pre class="cellPre">{{ r.ua }}</pre>
              </td>
              <td class="cellTop">
                <pre class="cellPre">{{ r.payloadText }}</pre>
              </td>
            </tr>

            <tr v-if="rows.length === 0">
              <td colspan="5" class="empty">No matching events.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <details class="raw">
        <summary>Raw events ({{ events.length }})</summary>
        <pre class="rawPre">{{ JSON.stringify(events, null, 2) }}</pre>
      </details>
    </section>
  </main>
</template>

<style scoped>
/* Fixed dark theme */
.app {
  --bg: #0b0f17;
  --panel: #0f1624;
  --panel-2: #0c1422;
  --text: #e8eefc;
  --muted: #a9b4cf;
  --border: #263248;
  --header: #111b2d;
  --rowEven: #0e1727;
  --hover: #17233a;
  --accent: #7aa2ff;
  --danger: #ff6b81;

  font-family: system-ui, sans-serif;
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;

  background: var(--bg);
  color: var(--text);
}

h1 {
  margin: 0 0 12px 0;
}

.controls {
  display: flex;
  gap: 12px;
  align-items: end;
  flex-wrap: wrap;
}

label {
  color: var(--text);
}

input,
select,
button {
  color: var(--text);
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 10px;
  height: 32px;
}

input::placeholder {
  color: var(--muted);
}

button {
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  border-color: var(--accent);
}

.error {
  color: var(--danger);
}

.content {
  margin-top: 12px;
}

.summary {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  color: var(--text);
}

.filters {
  display: grid;
  /* Use flexible columns so inputs never overlap */
  grid-template-columns: 2fr 1fr 1fr max-content;
  gap: 12px;
  align-items: end;
  margin-top: 12px;
}

.filters > * {
  min-width: 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0; /* allow inputs to shrink within grid cells */
}

.label {
  font-size: 12px;
  color: var(--muted);
}

.search {
  min-width: 0;
}

.filters input,
.filters select {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.btn {
  height: 32px;
  align-self: end;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .filters {
    grid-template-columns: 1fr;
  }

  .btn {
    width: fit-content;
  }
}

.tableWrap {
  margin-top: 12px;
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--panel-2);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.table thead {
  position: sticky;
  top: 0;
  background: var(--header);
  z-index: 1;
}

.table th {
  text-align: left;
  padding: 10px 8px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
}

.table td {
  padding: 10px 8px;
  border-bottom: 1px solid var(--border);
}

.table tbody tr:nth-child(even) td {
  background: var(--rowEven);
}

.table tbody tr:hover td {
  background: var(--hover);
}

.cellTop {
  vertical-align: top;
}

.nowrap {
  white-space: nowrap;
}

.wTime {
  width: 170px;
}

.wIp {
  width: 140px;
}

.wType {
  width: 160px;
}

.wText {
  min-width: 320px;
}

.muted {
  color: var(--muted);
}

.small {
  font-size: 12px;
}

.cellPre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text);
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
}

.empty {
  padding: 12px;
  color: var(--muted);
}

.raw {
  margin-top: 12px;
}

.raw summary {
  color: var(--muted);
}

.rawPre {
  white-space: pre-wrap;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  color: var(--text);
}
</style>
