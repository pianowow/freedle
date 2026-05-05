# Share Link Feature Plan

This document describes the plan for adding a shareable challenge-link feature to Freedle. It is intended to be implemented incrementally, phase by phase. Each phase should be reviewable and shippable on its own.

---

## 1. Goals

- Allow a player to share a memorable completed game via a URL.
- A recipient who opens the URL plays the **exact same target word** the sharer played.
- Share text includes a spoiler-free **emoji result grid** so the sharer can show off (or commiserate) without revealing the word.
- Preserve the integrity of stats and achievements: **shared games do not count**.
- Do not expose the answer to anyone who inspects the URL.
- Do not pollute the address bar during normal play (no per-game URL updates).
- Support both **daily** and **random** game sharing.

## 2. Non-Goals (v1)

- Registering Freedle as a PWA Web Share Target (future enhancement).
- A separate "challenge" achievement track for shared games (future enhancement).
- Sharing **in-progress** games (only completed games are shareable).
- Auto-suggesting shares based on heuristics (e.g., 1-guess wins).
- Server-side share-link analytics.

---

## 3. URL Scheme

Two query parameters are recognized: `d` (daily) and `r` (random). Each value is the URL-safe base64 encoding of a colon-separated payload.

### 3.1 Daily share

```text
?d=<base64url>
```

Decoded payload:

```text
<dictVersion>:<YYYY-MM-DD>:<length>:<wordHash>
```

Example payload (pre-encoding): `1:2026-04-28:5:ba587b1aac2552dc`

### 3.2 Random share

```text
?r=<base64url>
```

Decoded payload:

```text
<dictVersion>:<seed>:<length>:<wordHash>
```

Example payload (pre-encoding): `1:23457283:5:5891b5b522d5df08`

### 3.3 Hash

`wordHash` is the **first 16 hex characters** of `SHA-256(uppercase(targetWord))`, computed via `crypto.subtle.digest("SHA-256", ...)`.

Truncating to 16 hex chars (8 bytes) gives ~1-in-18-quintillion collision odds — more than sufficient for drift detection while keeping URLs short.

### 3.4 Word length

Word length **is** encoded in the URL.

This is required because the current word-selection logic (`getRandomWord` in `useGame.js`) picks from length-bucketed lists (`answerWords[4]`, `answerWords[5]`, `answerWords[6]`). The same seed produces three different words depending on which bucket is indexed. Encoding length explicitly:

- Avoids iterating lengths 4..6 and hash-checking each candidate on receipt.
- Preserves the existing per-length daily semantics (today's daily 4-letter, 5-letter, and 6-letter words are independent and remain so).
- Costs only 2 characters in the URL.
- Means the seed alone is **not** sufficient to identify a word — `(seed, length)` together identify it.

### 3.5 Receipt validation flow

1. Detect `d` or `r` param. If both are present, prefer `d` (daily wins).
2. Base64-decode and split on `:`. Reject if shape is wrong.
3. If `dictVersion > LATEST_DICT_VERSION` → show **"Update Freedle to play this challenge"** error.
4. Lazy-load the requested dictionary version (current version is preloaded; older versions fetched on demand).
5. Reconstruct the target word using the existing seeded selection logic with the encoded length:
   - Daily: seed = `dateKey(YYYY-MM-DD) + length`, picking from `answerWords[length]`.
   - Random: seed = the integer from the URL, picking from `answerWords[length]`.
6. Compute SHA-256 hash of the candidate word; compare first 16 hex chars to URL hash.
7. If hash does not match → show **"This challenge link is invalid or from a modified dictionary"**.
8. If match → proceed to the **receive shared link** flow (Phase 5).

---

## 4. Dictionary Versioning

### 4.1 Constants

```js
// frontend/src/composables/useGame.js (or a new constants module)
export const LATEST_DICT_VERSION = 1;
```

### 4.2 File naming

Rename the existing files to include the version:

- `frontend/public/data/target-dictionary.json` → `frontend/public/data/target-dictionary-v1.json`
- `frontend/public/data/allowed-guesses.txt` → `frontend/public/data/allowed-guesses-v1.txt`

`en.txt` is unrelated to gameplay and stays as-is.

### 4.3 Loader behavior

- New games and the initial app load always fetch the **latest** version.
- Shared-link receipt may request an older version. The loader caches loaded versions in memory (and via the existing `freedle-static-data-v1` Cache Storage if available).
- When word lists change in the future, ship `v2` files alongside `v1`, bump `LATEST_DICT_VERSION`, and keep `v1` files indefinitely so older share links remain playable.

### 4.4 Cache name

Consider renaming the Cache Storage cache from `freedle-static-data-v1` to something version-agnostic (e.g., `freedle-static-data`) or keep as-is and accept that the cache name happens to share a `v1` for unrelated reasons. **Decision deferred to Phase 1 implementation.**

---

## 5. Architectural Changes

### Phase 0 — Decouple `activeWordLength` from `settings.wordLength`

**Why first:** every later phase assumes a shared game can run at a length different from the user's preference without mutating settings.

Changes in `frontend/src/composables/useGame.js`:

- Add `const activeWordLength = ref(settingsStore.wordLength)`.
- Replace `const wordLength = computed(() => settingsStore.wordLength)` with `const wordLength = computed(() => activeWordLength.value)`.
- In `resetGame()` for non-shared games, set `activeWordLength.value = settingsStore.wordLength`.
- In `handleWordLengthChange(len)`, update both settings **and** `activeWordLength` (so behavior is unchanged for normal use).
- Verify all consumers (`gridStyle`, key handling, validation, stats recording, daily-state key) read from the computed `wordLength` and remain correct.

Tests:

- Update `frontend/src/composables/useGame.test.js` to assert that mutating `activeWordLength` independently of settings produces the right behavior (stats keyed by active length, grid sized to active length).
- Existing tests should continue to pass unchanged.

### Phase 1 — Dictionary versioning

- Rename data files with `-v1` suffix.
- Introduce `LATEST_DICT_VERSION` constant.
- Refactor `fetchDictionary()` to:
  - Always load `LATEST_DICT_VERSION` on startup.
  - Expose a `loadDictionaryVersion(version)` helper that returns `{ dictionary, allowedGuesses, answerWords }` for a specific version, with in-memory memoization.
- Add a friendly error path when a requested version file is missing (404).

Tests:

- Loader returns the same data for the latest version as before.
- Requesting a non-existent version surfaces a clear error.

### Phase 2 — Share-link codec

New file: `frontend/src/utils/shareLink.js`

API:

```js
// All async because hashing uses SubtleCrypto
async function buildDailyShareUrl({ version, date, word }) // → absolute URL string
async function buildRandomShareUrl({ version, seed, word }) // → absolute URL string
function parseShareParams(searchParams) // → { type: 'daily', version, date, length, hash } | { type: 'random', version, seed, length, hash } | null
async function hashWord(word) // → 16-char lowercase hex string
async function verifyShare(decoded, candidateWord) // → boolean
```

Supporting changes:

- `useGame.js` must expose the **seed used for the current random game** so the share button can encode it. Today, random games use `Math.random()` — replace with: pick a 32-bit integer seed via `Math.floor(Math.random() * 2**32)`, then run that seed through `seededRandom` to choose the word. Store the seed on the active game state (e.g., `currentRandomSeed`).
- Daily games already have a deterministic date key; expose that too (or recompute on demand).

Tests in `frontend/src/utils/shareLink.test.js`:

- Round-trip: build → parse → verify against the original word.
- Verify rejects when the word is changed.
- Parse rejects malformed base64, wrong segment count, non-numeric version/seed, malformed date.
- Daily and random both supported.

### Phase 3 — Emoji result grid

Add a util `frontend/src/utils/resultGrid.js`:

```js
function buildResultGrid({ guesses, target, wordLength }) // → multi-line string
```

The utility returns the share-text body only. The URL is appended by the Phase 4 share-button flow, not by `buildResultGrid()`.

Format:

```text
Freedle — 3 Guesses! ⭐
🟩⬛🟨⬛⬛
🟩🟩🟨⬛⬛
🟩🟩🟩🟩🟩
Can you beat my score?! 
```

- Loss case shows `Loss! 😖` instead of `N Guesses! ⭐` and `Can you solve it?!` instead of `Can you beat my score?!`.
- Uses `evaluateTileColor` from `useGame.js` so the grid matches what was on-screen.

Tests:

- Win and loss both produce expected strings.
- Hard and Count settings toggles do not change the share text.
- Idle/empty rows are not rendered.

### Phase 4 — Share button on endgame screen

- New component `frontend/src/components/ShareButton.vue`.
- Rendered on every endgame screen (won and lost) in `App.vue`, alongside the existing **New Game** button.
- On click:
  1. Build the share URL from the current game (daily or random).
  2. Build the emoji result grid (Phase 3) and concatenate with the URL.
  3. If `navigator.share` is available, call it with `{ text }`. Otherwise, copy `text` to the clipboard via `navigator.clipboard.writeText` and show a brief "Copied!" toast (reuse `BaseToast.vue`).

### Phase 5 — Receive shared link

Wired into `App.vue` `onMounted` (after `fetchDictionary` completes, or coordinated with it):

1. Parse `window.location.search` via `parseShareParams`.
2. If no share param → continue normal flow.
3. If `version > LATEST_DICT_VERSION` → toast: **"Update Freedle to play this challenge"**, then clear URL and exit.
4. Load the requested dictionary version (Phase 1).
5. Reconstruct the candidate word(s) and `verifyShare`.
6. If verification fails → toast: **"This challenge link is invalid or from a modified dictionary"**, clear URL, exit.
7. If verification succeeds, decide what to do based on current game state:

| Current state                     | Action                                                                                         |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| No active game (fresh load)       | Load the challenge directly.                                                                   |
| Random game in progress           | Treat as "no active game" for v1 and load the challenge directly. Random-game resume is deferred to a separate feature: see issue 26. |
| Daily game in progress            | Treat as "no active game" - load the challenge.                                                |

8. When loading the challenge:
   - Set `isSharedGame = true` on `useGame`.
   - Set `activeWordLength` to the shared word's length (no change to settings).
   - Set `targetWord` and `targetMeanings` directly from the resolved word + dictionary entry.
   - Reset guesses, currentRow, keyStatuses, etc., as in a normal `resetGame`.
   - **Skip** all stats/achievement recording in `handleKeyClick` when `isSharedGame === true`. This means **no `recordWin`, no `recordLoss`, no `gamesPlayed` increment.**
   - Event logging: still log `game-start`/`game-win`/`game-loss` to the backend with a `shared: true` flag for analytics. (The backend log is server-side telemetry, not stats)

9. Always call `history.replaceState(null, '', window.location.pathname)` to clear the share params from the address bar after step 6 or 7.

After a shared game ends:

- Endgame screen shows **Share** (re-shares the original challenge link with the player's grid) and **New Game** (returns to the user's normal settings, starts a fresh random game, clears `isSharedGame`).

### Phase 6 — Polish

- Visual badge or banner during challenge mode (e.g., a small "🔗 Challenge" label near the grid).

---

## 6. Anti-Cheat Posture

- Shared games **never** count toward stats or achievements. The "games played" counter is also untouched, to avoid the confusion of partially-counted games.
- The address bar **never** auto-updates per game. The URL only changes when the user explicitly opens a share link, and is cleared immediately after intake.
- The word hash means the URL alone does not reveal the answer.
- Self-sharing for achievement farming is high-friction and pointless (no stats credit).
- Settings/localStorage manipulation via DevTools is acknowledged and out of scope. The bar is "no accidental cheating", not "no determined cheating".

---

## 7. Testing Strategy

Unit tests:

- Share codec: build/parse/verify round-trips, malformed inputs, dict version mismatch, date format edge cases (leading zeros, etc.).
- Emoji grid builder: win, loss, all word lengths.
- `useGame` decoupling: `activeWordLength` and `settings.wordLength` can diverge; stats key off the active length; settings remain unchanged after a shared game.
- `useGame` shared-game branches: stats/achievements not recorded when `isSharedGame === true`.

Manual test matrix:

- Random share: same dict version → works.
- Daily share: today → works.
- Receive link with random game in progress → challenge loads directly for v1. Random-game resume/abandon UX is deferred to a separate feature.
- Receive link with daily game in progress for today → loads challenge directly since daily game can be resumed.
- Receive link with no game in progress → loads challenge directly.
- Cross-length share: 5-letter shared with recipient on 6-letter setting → challenge plays at 5; settings remain 6 after challenge ends.
- Web Share API path (mobile) and clipboard path (desktop) both produce correct text + URL.
- Both `?d` and `?r` present → `?d` wins.
- Tampered hash in URL → graceful error.

---

## 8. Open / Future Items

- **PWA Web Share Target API.** Register Freedle in `manifest.webmanifest` (Vite PWA plugin) so received share URLs open the installed PWA directly. Spec: https://developer.mozilla.org/en-US/docs/Web/Manifest/share_target
- **Challenge achievement track.** A separate set of achievements specifically for shared games (e.g., "Solved 10 challenges from friends") so social-mode play still has progression.
- **Auto-suggest sharing** on memorable games (1-guess wins, last-row saves, etc.).
- **Recent challenges list** in localStorage for easy re-access.
- **Server-side analytics** on share usage (counts, conversion to plays, etc.) using the existing JSONL event pipeline.
- backend endpoints for share creation, share accepting, frontend calls to that as appropriate.  want to log errors on share links not working distinctly.  Surface errors in their own table in admin. 
- **Persist in-progress random games across reload/navigation.** This is useful independently of share links. Once random games can be resumed, revisit whether challenge intake should offer an abandon/resume choice.

---

## 9. Implementation Order Summary

1. **Phase 0** — Decouple `activeWordLength` from settings. _(Refactor + tests.)_
2. **Phase 1** — Dictionary versioning: rename files, add version loader. _(Infrastructure.)_
3. **Phase 2** — Share codec utility + expose `currentRandomSeed`. _(Pure utility + small `useGame` change.)_
4. **Phase 3** — Emoji result grid utility. _(Pure utility.)_
5. **Phase 4** — Endgame Share button using Phases 2+3. _(UI.)_
6. **Phase 5** — Receive shared link flow. _(UI + glue.)_
7. **Phase 6** — Polish: challenge mode badge

Each phase should land with passing tests and no regressions before moving to the next.
