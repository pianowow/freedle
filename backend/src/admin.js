import fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fs from "node:fs";
import path from "node:path";

const LOG_LEVEL = process.env.LOG_LEVEL || "info";

const app = fastify({
  logger: { level: LOG_LEVEL },
  trustProxy: true,
});

const EVENTS_DIR = process.env.EVENTS_DIR || "/data";
fs.mkdirSync(EVENTS_DIR, { recursive: true });

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

/**
 * Optional auth guard to avoid accidental exposure.
 * If ADMIN_TOKEN is set, clients must send header: x-admin-token: <token>
 */
app.addHook("onRequest", async (req, reply) => {
  if (!ADMIN_TOKEN) return;

  // Allow the viewer (static assets) without token; protect only the API.
  if (!req.url.startsWith("/api/")) return;

  const token = req.headers["x-admin-token"];
  if (token !== ADMIN_TOKEN) {
    return reply.code(401).send({ ok: false, error: "unauthorized" });
  }
});

const STATIC_ROOT =
  process.env.ADMIN_STATIC_DIR || path.join("/app", "admin-dist");

await app.register(fastifyStatic, {
  root: STATIC_ROOT,
  index: ["index.html"],
});

function yyyyMmDd(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

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

app.get("/health", async () => ({
  status: "ok",
  time: new Date().toISOString(),
}));

app.get("/api/events", async (req, reply) => {
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

const port = Number(process.env.ADMIN_PORT || process.env.PORT || 8001);
const host = process.env.HOST || "0.0.0.0";

app.setNotFoundHandler((req, reply) => {
  // SPA fallback: serve index.html for non-API routes
  if (!req.url.startsWith("/api/") && req.method === "GET") {
    return reply.sendFile("index.html");
  }
  return reply.code(404).send({ ok: false, error: "not_found" });
});

app.listen({ port, host }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
