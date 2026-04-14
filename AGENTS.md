# Freedle Project Summary

Freedle is an open-source, ad-free word game inspired by Wordle. It supports multiple word lengths (4, 5, and 6 letters), daily and random game modes, and persistent statistics/achievements.

## Tech Stack

- **Frontend:** Vue 3, Vite, Pinia (state management), Vanilla CSS.
- **Backend:** Node.js, Fastify.
- **Admin:** Vue 3 (frontend), Fastify (backend).
- **Deployment:** Docker, GitHub Actions.
- **Data Persistence:** LocalStorage for game state, stats, and settings; JSONL files for server-side event logging.

## Project Structure

```text
freedle/
├── admin-frontend/         # Vue 3 application for event log visualization
├── backend/                # Fastify backend
│   └── src/
│       ├── index.js        # Main event logging server (port 8000)
│       └── admin.js        # Admin API and static file server (port 8001)
├── frontend/               # Main game Vue 3 application
│   ├── public/data/        # Dictionary and word list files
│   └── src/
│       ├── components/     # UI components (Grid, Keyboard, Modals, etc.)
│       ├── composables/    # Core game logic (useGame.js)
│       ├── data/           # Word lists and achievement definitions
│       └── stores/         # Pinia stores (dailyGame, settings, stats)
└── public/data/            # Symlinked or duplicated word lists
```

## Key Components & Logic

### Core Game Logic (`frontend/src/composables/useGame.js`)
Handles the primary game loop:
- **Dictionary Management:** Loads target words and allowed guesses.
- **Game State:** Manages current guesses, row, target word, and game status (`playing`, `won`, `lost`).
- **Modes:** Implements "Hard Mode" (must use hints) and "Count Mode" (shows letter frequency in the target word).
- **Seeded Random:** Uses `seededRandom` (mulberry32) for the Daily Game to ensure all users get the same word based on the date.
- **Event Logging:** Calls the backend to log `game-start`, `game-win`, and `game-loss`.

### State Management (`frontend/src/stores/`)
- **`settingsStore.js`:** Manages user preferences like word length, dark mode, hard mode, and count mode.
- **`statsStore.js`:** Tracks games played, win streaks, guess distribution, and achievements. Persisted in LocalStorage.
- **`dailyGameStore.js`:** Saves the state of the current daily game to allow progress recovery within the same day.

### Backend Event Logging (`backend/src/index.js`)
A lightweight Fastify server that:
- Receives game events via POST requests.
- Appends events to daily JSONL files (`events-YYYY-MM-DD.jsonl`) in a data directory.
- Implements basic log retention (default 365 days).
- Handles Private Network Access (PNA) preflight requests.

### Admin Panel (`admin-frontend/` & `backend/src/admin.js`)
- Provides a dashboard to view and filter game event logs.
- Supports filtering by date, event type, and IP.
- Optional token-based authentication (`ADMIN_TOKEN`).

## Data Files (`frontend/public/data/`)
- **`target-dictionary.json`:** Common words with meanings, used for target words.
- **`allowed-guesses.txt`:** Comprehensive list of valid words for guessing.
- **`en.txt`:** Full word list (sometimes used for filtering or validation).

## Future Considerations for Agents

- **Word Lists:** When adding new words, ensure they are added to `target-dictionary.json` with meanings to maintain consistency.
- **Achievements:** New achievements can be added in `frontend/src/data/achievements.js`.
- **Backend Analytics:** The JSONL logs can be processed for more advanced analytics (e.g., average guesses per word, most difficult words).
- **Localization:** The project is currently focused on English; localization would require multi-language support in stores and dictionary fetching logic.
