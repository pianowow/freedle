import fastify from "fastify";
import cors from "@fastify/cors";

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const LOG_LEVEL = process.env.LOG_LEVEL || "info";

const app = fastify({
  logger: { level: LOG_LEVEL },
  trustProxy: true,
});

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
  app.log.info(event); // JSON to stdout
  return { ok: true };
});

const port = Number(process.env.PORT || 8000);
const host = process.env.HOST || "0.0.0.0";

app.listen({ port, host }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
