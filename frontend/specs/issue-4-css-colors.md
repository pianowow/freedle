# Issue 4 CSS Colors Plan

Issue 4 is the prerequisite theming cleanup noted in the GitHub comments ("Needed before #10"). The implementation goal is not just "move colors into variables"; it is to remove hard-coded color values from frontend styling, collapse near-duplicate shades into a smaller semantic palette, and make the naming functional so future themes can swap values without touching component CSS.

The issue comment also points at the intended structure:

- define global CSS variables centrally
- support theme overrides with `data-theme`
- keep components consuming semantic variables only

## Goals

- Remove hard-coded hex, `rgb()`, `rgba()`, `hsl()`, and named palette colors from `frontend/src/**/*.vue` and `frontend/src/style.css` consumers.
- Rename existing raw variables like `--green`, `--yellow`, `--absent`, and `--border` to functional names.
- Normalize "close enough" values into shared families instead of keeping many slightly different greens, yellows, and neutrals.
- Preserve the current dark visual design as the first themed palette.
- Keep color decisions in CSS only; templates and scripts should choose semantic classes or variants instead of passing colors or CSS variables directly.

## Non-Goals

- Shipping a full light theme in the same change.
- Restyling the app beyond CSS variable consolidation and small consistency fixes.
- Changing the admin frontend.

## Theme Structure

1. Put the global CSS variable contract in `frontend/src/style.css`.
2. Move the current dark palette into a `[data-theme="dark"]` block.
3. Set `document.documentElement.dataset.theme = "dark"` during app startup for the current behavior.
4. Allow components to use only `var(--...)`, `currentColor`, or `transparent`.
5. Prefer derived transparency from semantic variables instead of new one-off colors.
6. Keep template and script layers color-agnostic: they may choose semantic classes, attributes, or variants, but not pass color values.

## Consolidated Global Token List

This should be the single source of truth in `frontend/src/style.css`. Values below are the current dark-theme targets, with close variants intentionally consolidated.

| Token | Dark value | Use |
| --- | --- | --- |
| `--app-background` | `#0c0c0d` | page background, base dark surface |
| `--app-background-gradient` | `radial-gradient(circle at center, #1a1a1c 0%, #0c0c0d 100%)` | body background |
| `--surface-header` | `rgb(18 18 19 / 0.9)` | header, loading overlay shell |
| `--surface-scrim` | `rgb(0 0 0 / 0.75)` | modal backdrop |
| `--surface-panel` | `#121213` | modal low end, elevated dark surface base |
| `--surface-panel-raised` | `#1e1e1f` | modal high end, panel surfaces |
| `--surface-panel-strong` | `#2a2a2b` | toast high end, strongest neutral surface |
| `--surface-card` | `rgb(255 255 255 / 0.03)` | low-emphasis cards |
| `--surface-card-hover` | `rgb(255 255 255 / 0.05)` | stronger neutral card / chip background |
| `--surface-card-active` | `rgb(255 255 255 / 0.1)` | active neutral buttons, toggles, hover states |
| `--surface-overlay-highlight` | `rgb(255 255 255 / 0.08)` | challenge ribbon highlight layer |
| `--surface-overlay-line` | `rgb(255 255 255 / 0.06)` | inset highlight / glass line |
| `--border-subtle` | `rgb(255 255 255 / 0.05)` | very soft borders |
| `--border-default` | `rgb(255 255 255 / 0.1)` | standard borders |
| `--border-strong` | `rgb(255 255 255 / 0.14)` | emphasized glass border |
| `--text-primary` | `rgb(255 255 255 / 0.95)` | default readable text |
| `--text-strong` | `#ffffff` | headings / text on dark where full contrast is wanted |
| `--text-secondary` | `#a0a0a0` | secondary body text |
| `--text-muted` | `#818384` | tertiary text |
| `--text-disabled` | `rgb(255 255 255 / 0.2)` | disabled key text |
| `--text-on-accent` | `#ffffff` | text/icons on filled accent surfaces |
| `--text-title-gradient` | `linear-gradient(to bottom, #ffffff 0%, #a0a0a0 100%)` | app title and modal title text fill |
| `--shadow-elevated` | `0 25px 50px rgb(0 0 0 / 0.5)` | modal shadow |
| `--shadow-glow-soft` | `0 10px 40px rgb(from var(--accent-glow-color) r g b / 0.3)` | toast glow shadow |
| `--state-correct` | `#538d4e` | correct tile state, positive accent, success emphasis |
| `--state-correct-strong` | `#537d4e` | correct gradient low end |
| `--state-correct-bright` | `#60a15a` | brighter correct accent for selected controls |
| `--state-correct-deep` | `#3a6b35` | daily button low end |
| `--state-correct-tint-soft` | `rgb(83 141 78 / 0.1)` | unlocked card background, soft success highlight |
| `--state-correct-tint-strong` | `rgb(83 141 78 / 0.2)` | unlocked border / icon background |
| `--state-correct-glow` | `rgb(83 141 78 / 0.4)` | active daily button glow |
| `--state-correct-gradient` | `linear-gradient(rgb(110 169 94), rgb(83 125 78))` | primary filled action, correct tile, enter key |
| `--state-correct-gradient-hover` | `linear-gradient(rgb(104 161 90 / 0.8), rgb(83 125 78 / 0.8))` | hover state for correct/action fill |
| `--state-present-gradient` | `linear-gradient(rgb(217 206 85), rgb(128 124 3))` | present tile/key state |
| `--state-present-gradient-hover` | `linear-gradient(rgb(217 206 85 / 0.8), rgb(128 124 3 / 0.8))` | hover state for present fill |
| `--state-absent-border` | `#3a3a3c` | idle tile border, spinner track |
| `--state-absent-gradient` | `linear-gradient(rgb(77 77 77), rgb(38 38 38))` | neutral key/tile filled state |
| `--state-absent-gradient-hover` | `linear-gradient(rgb(77 77 77 / 0.8), rgb(38 38 38 / 0.8))` | hover state for absent fill |
| `--feedback-info` | `#446cc9` | reload/share/info toast accent |
| `--feedback-warning` | `#d6932f` | update-required toast accent |
| `--feedback-error` | `#c94444` | validation/error toast accent |
| `--action-destructive-gradient` | `linear-gradient(rgb(156 32 32), rgb(105 18 18))` | backspace/destructive action fill |
| `--action-destructive-gradient-hover` | `linear-gradient(rgb(156 32 32 / 0.8), rgb(105 18 18 / 0.8))` | destructive hover fill |

Notes:

- The current green family is intentionally collapsed into a single "correct / positive action" family instead of keeping separate one-off greens for buttons, tiles, badges, glows, and cards.
- The current neutral glass backgrounds should all come from the `surface` and `border` tokens instead of repeated white-alpha literals.
- `--accent-glow-color` should be assigned inside component CSS from semantic variant classes such as `.base-toast--info`, not passed in from template or script code.

## Component Mapping

| File | Replace hard-coded colors with |
| --- | --- |
| `frontend/src/style.css` | own all tokens above; remove `--green`, `--yellow`, `--absent`, `--border` |
| `frontend/src/App.vue` | `--surface-header`, `--border-default`, `--text-title-gradient`, `--surface-card`, `--surface-card-hover`, `--surface-card-active`, `--surface-overlay-highlight`, `--surface-overlay-line`, `--border-strong`, `--state-correct`, `--state-correct-tint-soft`, `--text-secondary`, `--text-muted`, `--text-strong`, `--state-absent-border`; replace color-bearing toast config with semantic variants/classes |
| `frontend/src/components/BaseModal.vue` | `--surface-scrim`, `--surface-panel`, `--surface-panel-raised`, `--border-default`, `--shadow-elevated`, `--surface-card-active`, `--text-secondary`, `--text-strong`, `--text-title-gradient`, `--state-correct` |
| `frontend/src/components/BaseToast.vue` | `--surface-panel-strong`, `--surface-panel-raised`, `--text-strong`, `--text-secondary`, `--text-on-accent`, `--feedback-info`, `--feedback-warning`, `--feedback-error`, `--state-correct`; replace `glowColor` prop with semantic variant/class handling |
| `frontend/src/components/AchievementToast.vue` | `--state-correct`; pass a semantic success variant/class only |
| `frontend/src/components/ReloadToast.vue` | `--feedback-info`; pass a semantic info variant/class only |
| `frontend/src/components/ValidationToast.vue` | `--feedback-error`; pass a semantic error variant/class only |
| `frontend/src/components/EndgameButtons.vue` | `--state-correct-gradient`, `--state-correct-gradient-hover`, `--text-on-accent`; replace toast color prop usage with semantic variant/class handling |
| `frontend/src/components/DailyGameIcon.vue` | `--surface-card-hover`, `--border-default`, `--surface-card-active`, `--text-secondary`, `--text-strong`, `--state-correct`, `--state-correct-deep`, `--state-correct-bright`, `--state-correct-glow`, `--text-on-accent` |
| `frontend/src/components/SettingsModal.vue` | `--surface-card`, `--surface-card-hover`, `--surface-card-active`, `--border-subtle`, `--border-default`, `--text-strong`, `--text-secondary`, `--state-correct-bright`, `--state-correct`, `--state-correct-tint-soft`, `--text-on-accent` |
| `frontend/src/components/StatsModal.vue` | `--text-strong`, `--text-secondary`, `--text-muted`, `--state-correct`, `--surface-card`, `--surface-card-active`, `--border-subtle`, `--state-correct-gradient`, `--state-correct-tint-soft`, `--state-correct-tint-strong`, `--text-on-accent` |
| `frontend/src/components/VirtualKeyboard.vue` | `--state-absent-gradient`, `--state-absent-gradient-hover`, `--state-correct-gradient`, `--state-correct-gradient-hover`, `--state-present-gradient`, `--state-present-gradient-hover`, `--action-destructive-gradient`, `--action-destructive-gradient-hover`, `--text-on-accent`, `--text-disabled` |
| `frontend/src/components/LetterTile.vue` | `--text-on-accent`, `--state-absent-border`, `--state-correct-gradient`, `--state-present-gradient`, `--state-absent-gradient`, `--surface-scrim` or a dedicated badge token derived from it for the count badge |

Components that already inherit `currentColor` correctly, such as `SettingsIcon.vue` and `StatisticsIcon.vue`, do not need their own palette tokens as long as the parent classes use the global variables above.

## Consolidation Rules

1. All success-like greens become one semantic family:
   `--state-correct`, `--state-correct-bright`, `--state-correct-deep`, `--state-correct-gradient`, and the soft/strong tints.
2. All neutral dark fills for keyboard/tile "absent" states become the absent family:
   `--state-absent-border`, `--state-absent-gradient`, `--state-absent-gradient-hover`.
3. All reusable glass-card backgrounds come from the `surface-card` family, not per-component `rgba(255,255,255,...)` literals.
4. All toast and scripted notification colors use semantic feedback names:
   `--feedback-info`, `--feedback-warning`, `--feedback-error`, `--state-correct`.
5. All text hierarchy comes from `--text-strong`, `--text-primary`, `--text-secondary`, `--text-muted`, and `--text-disabled`.
6. Templates and scripts may select semantic state such as `info`, `warning`, `error`, `success`, `correct`, `present`, or `absent`, but they may not pass color literals or `var(--...)` strings.

## Implementation Order

### Phase 1: Add enforcement before refactoring

- Add a linting/checking layer before changing component styles so the cleanup has an objective pass/fail signal from the start.
- Use CSS-aware linting for `.vue` `<style>` blocks and `frontend/src/style.css`, plus a small targeted check for script/template cases such as `glow-color="#..."`, `glowColor: "#..."`, `:style="{ color: ... }"`, and `:style="{ background: ... }"`.
- Configure the enforcement so component styles may use only `var(--...)`, `currentColor`, and `transparent` for color-like values, while `frontend/src/style.css` remains the single allowed source of raw palette definitions.
- Configure the enforcement so templates and scripts may not pass color literals or CSS variable strings; they must use semantic variants, modifier classes, or non-color attributes that CSS maps to tokens.
- Treat the lint output as the work queue for the remaining phases: each phase should reduce the remaining violations until the frontend is clean.
- Document the enforcement in `frontend/package.json` with both aggregate and specialized scripts.
- Preferred script shape:
  `lint` runs the full frontend lint suite, while `lint:js`, `lint:style`, and `check:theme-colors` remain available as focused commands for local debugging and CI clarity.
- This gives the repo both a simple single entry point and specialized jobs that can fail independently when needed.

### Phase 2: Establish global CSS variable contract

- Add the semantic token list to `frontend/src/style.css`.
- Move the current palette into `[data-theme="dark"]`.
- Replace uses of the old root variables with the new semantic names.

### Phase 3: Update shared primitives

- Refactor `BaseModal.vue` and `BaseToast.vue` first.
- Replace color props such as `glowColor` with semantic variants or modifier classes, and let component CSS map those variants to the global tokens.

### Phase 4: Update app shell and feature components

- Refactor `App.vue`, `DailyGameIcon.vue`, `EndgameButtons.vue`, `SettingsModal.vue`, `StatsModal.vue`.
- Replace script-level color literals and color variable passing in `App.vue` toast payloads with semantic variant names or class selection only.

### Phase 5: Update gameplay components

- Refactor `LetterTile.vue` and `VirtualKeyboard.vue`.
- Keep tile, keyboard, endgame button, and daily-button positive states visually aligned by sharing the same positive token family.

### Phase 6: Manual visual review workflow

- Do this work on a dedicated branch, not directly on `main`.
- Use a separate `git worktree` for `main` so the branch and baseline can run side by side without constant checkout switching.
- Example setup from the branch root:
  ```bash
  git worktree add ../freedle-main main
  ```
- Start the branch frontend from the working tree under development:
  ```bash
  cd frontend
  npm ci
  npm run dev -- --port 5173
  ```
- Start the `main` frontend from the comparison worktree on a second port:
  ```bash
  cd ../freedle-main/frontend
  npm ci
  npm run dev -- --port 5174
  ```
- Open both local URLs at the same time and compare equivalent states:
  `http://localhost:5173` for the branch under development and `http://localhost:5174` for `main`.
- During development, compare the branch build side by side with `main` so visual drift is obvious while the refactor is still in progress.
- Treat visible differences as intentional review items: each obvious change should be explicitly accepted as an improvement or adjusted to better match the current UI.
- Focus the side-by-side comparison on the header, modals, toasts, keyboard, tiles, endgame layout, and stats screens.
- This manual review workflow is owned by the user during development; it is not part of the coding agent's implementation responsibility.

### Phase 7: Verification

- Run the lint/check enforcement from Phase 1 and treat zero violations as the main completion gate.
- Run a frontend grep that finds remaining hard-coded palette values in `.vue` and `.css` files as a secondary backstop.
- Confirm no component still references `#538d4e`, `#446cc9`, `#c94444`, raw white-alpha overlays, or the old root variable names.
- Manually verify: header, modal, toast, keyboard, tile, endgame, and stats screens still match the current dark theme.

## Acceptance Criteria

- No frontend component stylesheet contains hard-coded palette colors.
- No template or script path passes hard-coded palette colors or `var(--...)` color strings.
- The only palette definitions live in `frontend/src/style.css`.
- The lint/check setup added in Phase 1 passes with zero violations for the frontend.
- Variable names are semantic and functional, not hue-based.
- Shared states look intentional and consistent across tiles, keyboard, buttons, badges, scrollbars, and notifications.
