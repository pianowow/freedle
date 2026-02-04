import fastify from "fastify";
import cors from "@fastify/cors";
import fs from "node:fs";
import path from "node:path";

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const LOG_LEVEL = process.env.LOG_LEVEL || "info";

const app = fastify({
  logger: { level: LOG_LEVEL },
  trustProxy: true,
});

const EVENTS_DIR = process.env.EVENTS_DIR || "/data";
const RETENTION_DAYS = Number(process.env.EVENTS_RETENTION_DAYS || 365);
fs.mkdirSync(EVENTS_DIR, { recursive: true });

let writeChain = Promise.resolve();
function yyyyMmDd(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function eventsPathForToday() {
  return path.join(EVENTS_DIR, `events-${yyyyMmDd()}.jsonl`);
}

async function appendEvent(event) {
  const line = JSON.stringify(event) + "\n";
  const filePath = eventsPathForToday();
  app.log.info({ filePath }, "Writing event to jsonl");
  writeChain = writeChain.then(() =>
    fs.promises.appendFile(filePath, line, "utf8"),
  );
  return writeChain;
}

async function enforceRetention() {
  if (!Number.isFinite(RETENTION_DAYS) || RETENTION_DAYS <= 0) return;
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const entries = await fs.promises.readdir(EVENTS_DIR).catch(() => []);
  await Promise.all(
    entries
      .filter((n) => n.startsWith("events-") && n.endsWith(".jsonl"))
      .map(async (name) => {
        const full = path.join(EVENTS_DIR, name);
        const st = await fs.promises.stat(full).catch(() => null);
        if (st && st.mtimeMs < cutoff)
          await fs.promises.unlink(full).catch(() => {});
      }),
  );
}

//every 6 hours
setInterval(() => void enforceRetention(), 6 * 60 * 60 * 1000).unref();

await app.register(cors, {
  origin: (origin, cb) => {
    // allow same-origin (no Origin header) and explicit matches
    if (!origin) return cb(null, true);
    cb(null, ALLOWED_ORIGINS.includes(origin));
  },
  methods: ["POST", "GET", "OPTIONS"],
  allowedHeaders: ["*"],
});

function getClientInfo(req) {
  const h = req.headers;
  const ip =
    h["cf-connecting-ip"] ||
    h["x-forwarded-for"]?.split(",")[0].trim() ||
    req.ip;
  return {
    ip,
    user_agent: h["user-agent"],
    referer: h["referer"],
    country: h["cf-ipcountry"],
    accept_language: h["accept-language"],
    origin: h["origin"],
  };
}

app.get("/health", async () => ({
  status: "ok",
  time: new Date().toISOString(),
}));

app.post("/events/game-start", async (req) => {
  const payload = req.body || {};
  const event = {
    type: "game_start",
    server_ts: new Date().toISOString(),
    payload,
    client: getClientInfo(req),
  };
  await appendEvent(event);
  app.log.info(event); // JSON to stdout
  return { ok: true };
});

function parseYyyyMmDd(s) {
  if (typeof s !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s + "T00:00:00.000Z");
  if (Number.isNaN(d.getTime())) return null;
  // ensure we didn't overflow into another date (e.g. 2024-02-31)
  if (d.toISOString().slice(0, 10) !== s) return null;
  return d;
}

async function readJsonlFile(filePath, remaining, out) {
  if (remaining <= 0) return 0;
  const content = await fs.promises.readFile(filePath, "utf8");
  const lines = content.split("\n");
  let added = 0;
  for (const line of lines) {
    if (!line) continue;
    try {
      out.push(JSON.parse(line));
      added++;
      if (added >= remaining) break;
    } catch {
      // skip malformed lines
    }
  }
  return added;
}

app.get("/events", async (req, reply) => {
  const { start, max } = req.query || {};

  const startDate = parseYyyyMmDd(start);
  if (!startDate) {
    return reply.code(400).send({
      ok: false,
      error: "Invalid 'start' query param. Expected YYYY-MM-DD.",
    });
  }

  const maxEntriesRaw = max === undefined ? 1000 : Number(max);
  const maxEntries = Number.isFinite(maxEntriesRaw)
    ? Math.floor(maxEntriesRaw)
    : NaN;
  if (!Number.isFinite(maxEntries) || maxEntries <= 0) {
    return reply.code(400).send({
      ok: false,
      error: "Invalid 'max' query param. Expected a positive number.",
    });
  }

  const results = [];
  let remaining = maxEntries;

  // List available log files, then iterate in filename order.
  // This avoids stopping early if a day's file is missing.
  const startStr = yyyyMmDd(startDate);
  const entries = await fs.promises.readdir(EVENTS_DIR).catch(() => []);
  const files = entries
    .filter((n) => n.startsWith("events-") && n.endsWith(".jsonl"))
    .sort();

  for (const name of files) {
    if (remaining <= 0) break;

    // Since format is events-YYYY-MM-DD.jsonl, string compare works chronologically.
    const datePart = name.slice("events-".length, -".jsonl".length);
    if (datePart.length !== 10) continue;
    if (datePart < startStr) continue;

    const filePath = path.join(EVENTS_DIR, name);
    const added = await readJsonlFile(filePath, remaining, results);
    remaining -= added;
  }

  return {
    ok: true,
    start: startStr,
    max: maxEntries,
    count: results.length,
    events: results,
  };
});

const port = Number(process.env.PORT || 8000);
const host = process.env.HOST || "0.0.0.0";

app.listen({ port, host }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
