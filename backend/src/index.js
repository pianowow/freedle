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
          await fs.promises.unlink(full).catch(() => { });
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
  // Cloudflare usually provides the real IP in 'cf-connecting-ip'
  // If missing, we fall back to Fastify's req.ip (which respects trustProxy/X-Forwarded-For)
  const ip = h["cf-connecting-ip"] || req.ip;

  return {
    ip,
    user_agent: h["user-agent"],
    referer: h["referer"],
    country: h["cf-ipcountry"],
    accept_language: h["accept-language"],
    origin: h["origin"],
    // Diagnostic headers to help identify proxy issues
    proxy_chain: h["x-forwarded-for"],
    real_ip: h["x-real-ip"],
    cf_ray: h["cf-ray"],
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

app.post("/events/game-win", async (req) => {
  const payload = req.body || {};
  const event = {
    type: "game_win",
    server_ts: new Date().toISOString(),
    payload,
    client: getClientInfo(req),
  };
  await appendEvent(event);
  app.log.info(event); // JSON to stdout
  return { ok: true };
});

app.post("/events/game-loss", async (req) => {
  const payload = req.body || {};
  const event = {
    type: "game_loss",
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

const port = Number(process.env.PORT || 8000);
const host = process.env.HOST || "0.0.0.0";

app.listen({ port, host }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
