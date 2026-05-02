const SHARE_LENGTHS = new Set([4, 5, 6]);
const SHARE_HASH_PATTERN = /^[0-9a-f]{16}$/;
const SHARE_BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const DAILY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANDOM_SEED = 2 ** 32;

function encodeBase64Url(value) {
  const base64 = typeof btoa === "function"
    ? btoa(value)
    : globalThis.Buffer.from(value, "utf-8").toString("base64");

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function decodeBase64Url(value) {
  if (!SHARE_BASE64URL_PATTERN.test(value)) {
    throw new Error("Malformed share payload");
  }

  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (padded.length % 4)) % 4;
  const base64 = `${padded}${"=".repeat(paddingLength)}`;

  return typeof atob === "function"
    ? atob(base64)
    : globalThis.Buffer.from(base64, "base64").toString("utf-8");
}

function buildShareUrl(paramName, payload) {
  if (typeof window === "undefined") {
    throw new Error("Share URLs require a browser environment.");
  }

  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set(paramName, encodeBase64Url(payload));
  return url.toString();
}

function parsePositiveInteger(value) {
  if (!/^\d+$/u.test(value)) return null;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function parseWordLength(value) {
  const length = parsePositiveInteger(value);
  return SHARE_LENGTHS.has(length) ? length : null;
}

function isValidDailyDate(date) {
  if (!DAILY_DATE_PATTERN.test(date)) return false;

  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === date;
}

function validateVersion(version) {
  if (!Number.isInteger(version) || version < 1) {
    throw new Error(`Invalid dictionary version: ${version}`);
  }
}

function validateWord(word) {
  const normalizedWord = String(word ?? "").trim().toUpperCase();
  const wordLength = normalizedWord.length;

  if (!SHARE_LENGTHS.has(wordLength)) {
    throw new Error(`Unsupported share word length: ${wordLength}`);
  }

  return normalizedWord;
}

function validateRandomSeed(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed >= MAX_RANDOM_SEED) {
    throw new Error(`Invalid random seed: ${seed}`);
  }
}

export async function hashWord(word) {
  const normalizedWord = validateWord(word);
  const bytes = new TextEncoder().encode(normalizedWord);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return hex.slice(0, 16);
}

export async function buildDailyShareUrl({ version, date, word }) {
  validateVersion(version);
  if (!isValidDailyDate(date)) {
    throw new Error(`Invalid daily share date: ${date}`);
  }

  const normalizedWord = validateWord(word);
  const payload = [
    version,
    date,
    normalizedWord.length,
    await hashWord(normalizedWord),
  ].join(":");

  return buildShareUrl("d", payload);
}

export async function buildRandomShareUrl({ version, seed, word }) {
  validateVersion(version);
  validateRandomSeed(seed);

  const normalizedWord = validateWord(word);
  const payload = [
    version,
    seed,
    normalizedWord.length,
    await hashWord(normalizedWord),
  ].join(":");

  return buildShareUrl("r", payload);
}

function parseSharePayload(type, encodedPayload) {
  try {
    const decodedPayload = decodeBase64Url(encodedPayload);
    const parts = decodedPayload.split(":");

    if (parts.length !== 4) {
      return null;
    }

    const version = parsePositiveInteger(parts[0]);
    const length = parseWordLength(parts[2]);
    const hash = parts[3];

    if (version === null || length === null || !SHARE_HASH_PATTERN.test(hash)) {
      return null;
    }

    if (type === "daily") {
      const date = parts[1];
      if (!isValidDailyDate(date)) return null;

      return {
        type,
        version,
        date,
        length,
        hash,
      };
    }

    const seed = parsePositiveInteger(parts[1]);
    if (seed === null || seed >= MAX_RANDOM_SEED) {
      return null;
    }

    return {
      type,
      version,
      seed,
      length,
      hash,
    };
  } catch {
    return null;
  }
}

export function parseShareParams(searchParams) {
  if (!searchParams || typeof searchParams.get !== "function") {
    return null;
  }

  const dailyPayload = searchParams.get("d");
  if (dailyPayload !== null) {
    return parseSharePayload("daily", dailyPayload);
  }

  const randomPayload = searchParams.get("r");
  if (randomPayload !== null) {
    return parseSharePayload("random", randomPayload);
  }

  return null;
}

export async function verifyShare(decoded, candidateWord) {
  if (!decoded || !SHARE_LENGTHS.has(decoded.length)) {
    return false;
  }

  const normalizedWord = String(candidateWord ?? "").trim().toUpperCase();
  if (normalizedWord.length !== decoded.length) {
    return false;
  }

  return (await hashWord(normalizedWord)) === decoded.hash;
}
