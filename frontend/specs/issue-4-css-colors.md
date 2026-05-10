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
- Make favicon, Apple touch icon, and browser/app theme metadata match the same visual system so those surfaces do not drift from the in-app theme.

## Non-Goals

- Shipping a full light theme in the same change.
- Restyling the app beyond CSS variable consolidation and small consistency fixes.
- Changing the admin frontend.
- Implementing the icon-generation pipeline in this planning pass. This document only defines the required scope and constraints for that later work.

## Theme Structure

1. Put the global CSS variable contract in `frontend/src/style.css`.
2. Move the current dark palette into a `[data-theme="dark"]` block.
3. Set `document.documentElement.dataset.theme = "dark"` during app startup for the current behavior.
   Hardcoded dark default is accepted in this issue; future work should define persisted user theme preference and precedence rules.
4. Allow components to use only `var(--...)`, `currentColor`, or `transparent`.
5. Prefer derived transparency from semantic variables instead of new one-off colors.
6. Keep template and script layers color-agnostic: they may choose semantic classes, attributes, or variants, but not pass color values.
7. Treat favicon/touch assets and manifest theme metadata as part of the same theme system, not as unrelated static files.

## Consolidated Global Token List

This should be the single source of truth in `frontend/src/style.css`. Values below are the current dark-theme targets, with close variants intentionally consolidated.

| Token | Dark value | Use |
| --- | --- | --- |
| `--app-background` | `#0c0c0d` | page background, base dark surface |
| `--app-background-gradient` | `radial-gradient(circle at center, #1a1a1c 0%, #0c0c0d 100%)` | body background |
| `--app-chrome-theme` | `#0c0c0d` | browser UI theme color, manifest theme color, fallback solid for surfaces that cannot render gradients |
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
- The current neutral glass backgrounds should all come from the `surface` and `border` vars instead of repeated white-alpha literals.
- `--accent-glow-color` should be assigned inside component CSS from semantic variant classes such as `.base-toast--info`, not passed in from template or script code.
- `--app-chrome-theme` exists because browser and manifest metadata expect a solid color even when the main app surface uses a gradient.

## Theme-Managed Icon Assets

The favicon and Apple touch icon should be treated as outputs of the theme system, not hand-maintained artwork that happens to live in `frontend/public/`.

Requirements:

- Keep a single source of truth for icon colors and gradients within the theme contract.
- Generate icon assets from those variables through a dedicated checked-in script under `frontend/scripts/`; do not maintain unrelated raster artwork by hand.
- Prefer a generated SVG source as the canonical icon artwork for modern browsers, then derive PNG sizes from that source with a Node-based generator.
- Keep `frontend/index.html` icon links, `frontend/public/manifest.json`, and the generated asset files aligned.
- Use existing dark theme as generation inputs instead of defining icon-only colors: the icon background should come from `--state-correct-gradient`, and the foreground `F` should come from `--text-on-accent`.
- The icon artwork should be a single capital `F` in white on the semantic success/correct gradient, using rounded corners as part of the icon shape.
- The area outside those rounded corners should stay transparent rather than being filled with a page-background color.
- Keep the generated icon simple and legible at `16x16`; do not depend on small text, fine detail, or subtle transparency alone.
- The generation flow should write the committed outputs into `frontend/public/`, and the normal frontend build should consume those files without regenerating them.

Implementation constraints for the later feature:

- Do not parse arbitrary component CSS to invent icon artwork. Read only the defined theme variables.
- Parse `frontend/src/style.css` with `postcss` in the generator script, and read only variables defined in the `[data-theme="dark"]` token contract. Do not parse component styles.
- Use `sharp` from frontend dev dependencies to derive PNG assets from the canonical SVG; do not depend on system-level image tools such as ImageMagick.
- Do not require a browser screenshot pipeline unless SVG generation proves insufficient. Direct SVG generation from CSS vars is the preferred default because it is deterministic and cheap.
- Treat `meta[name="theme-color"]`, `manifest.json.theme_color`, and `manifest.json.background_color` as part of the same review surface as the icon assets.
- Rounded corners are a structural part of the icon artwork and do not require their own theme variable in this plan.
- Preserve alpha outside the rounded icon silhouette for formats that support transparency.
- If tooling is added for asset generation, it must be documented in `frontend/package.json` scripts and fit the existing build workflow cleanly.
- The generation script should be an explicit as-needed command, not a side effect of `vite build`, so normal builds do not rewrite tracked icon assets.

## Component Mapping

| File | Replace hard-coded colors with |
| --- | --- |
| `frontend/src/style.css` | own all variables above; remove `--green`, `--yellow`, `--absent`, `--border` |
| `frontend/src/App.vue` | `--app-background-gradient`, `--border-default`, `--text-title-gradient`, `--surface-card`, `--surface-card-hover`, `--surface-card-active`, `--surface-overlay-highlight`, `--surface-overlay-line`, `--border-strong`, `--state-correct`, `--state-correct-tint-soft`, `--text-secondary`, `--text-muted`, `--text-strong`, `--state-absent-border`; replace color-bearing toast config with semantic variants/classes |
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
| `frontend/src/components/LetterTile.vue` | `--text-on-accent`, `--state-absent-border`, `--state-correct-gradient`, `--state-present-gradient`, `--state-absent-gradient`, `--surface-scrim` or a dedicated badge variable derived from it for the count badge |
| `frontend/index.html` | generated favicon references should stay aligned with the theme-managed asset set; `meta[name="theme-color"]` should use the semantic app chrome color |
| `frontend/public/manifest.json` | `theme_color` and `background_color` should reflect the theme, and icon entries should match the generated asset set |
| `frontend/public/favicon.svg`, `frontend/public/favicon-32x32.png`, `frontend/public/favicon-16x16.png`, `frontend/public/apple-touch-icon.png`, `frontend/public/icon-192x192.png`, `frontend/public/icon-512x512.png` | treat as generated outputs from the shared icon design, not manually edited standalone assets |
| `frontend/scripts/*` | host the explicit icon-generation script that reads the theme and writes committed outputs into `frontend/public/` |
| `frontend/package.json` | document the explicit icon-generation script and keep it separate from the normal build command |

Components that already inherit `currentColor` correctly, such as `SettingsIcon.vue` and `StatisticsIcon.vue`, do not need their own palette variables as long as the parent classes use the global variables above.

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
7. Browser-facing assets and metadata must come from the theme too: icon generation should reuse existing variables, and `theme-color`, manifest colors, and icon file references should stay in sync.

## Implementation Order

### Phase 1: Add enforcement before refactoring

- Add a linting/checking layer before changing component styles so the cleanup has an objective pass/fail signal from the start.
- Use `stylelint`, `stylelint-config-standard-vue`, and `stylelint-declaration-strict-value` for style enforcement in `.vue` `<style>` blocks and CSS files.
- Use CSS-aware linting for `.vue` `<style>` blocks and `frontend/src/style.css`, plus a small targeted check for script/template cases such as `glow-color="#..."`, `glowColor: "#..."`, `:style="{ color: ... }"`, and `:style="{ background: ... }"`.
- Configure the enforcement so component styles may use only `var(--...)`, `currentColor`, and `transparent` for color-like values, while `frontend/src/style.css` remains the single allowed source of raw palette definitions.
- Enforce color-value discipline with `stylelint-declaration-strict-value`: disallow raw color literals in component styles and allow only semantic variables or approved keywords (`var(--...)`, `currentColor`, `transparent`).
- Configure the enforcement so templates and scripts may not pass color literals or CSS variable strings; they must use semantic variants, modifier classes, or non-color attributes that CSS maps to variables.
- Treat the lint output as the work queue for the remaining phases: each phase should reduce the remaining violations until the frontend is clean.
- Document the enforcement in `frontend/package.json` with both aggregate and specialized scripts.
- Preferred script shape:
  `lint` runs the full frontend lint suite, while `lint:js`, `lint:style` (Stylelint), and `check:theme-colors` remain available as focused commands for local debugging and CI clarity.
- This gives the repo both a simple single entry point and specialized jobs that can fail independently when needed.

### Phase 2: Establish global CSS variable contract

- Add the semantic variables to `frontend/src/style.css`.
- Move the current palette into `[data-theme="dark"]`.
- Replace uses of the old root variables with the new semantic names.

### Phase 3: Update shared primitives

- Refactor `BaseModal.vue` and `BaseToast.vue` first.
- Replace color props such as `glowColor` with semantic variants or modifier classes, and let component CSS map those variants to the global variables.

### Phase 4: Update app shell and feature components

- Refactor `App.vue`, `DailyGameIcon.vue`, `EndgameButtons.vue`, `SettingsModal.vue`, `StatsModal.vue`.
- Replace script-level color literals and color variable passing in `App.vue` toast payloads with semantic variant names or class selection only.

### Phase 5: Update gameplay components

- Refactor `LetterTile.vue` and `VirtualKeyboard.vue`.
- Keep tile, keyboard, endgame button, and daily-button positive states visually aligned by sharing the same positive variable family.

### Phase 6: Specify theme-managed icon generation

- Define the canonical icon design constraints while the palette refactor is still fresh, so the asset work does not become an unrelated follow-up with ad hoc colors.
- Choose and document which existing variables drive icon background, foreground, and browser chrome metadata.
- Lock the icon art direction before implementation: a single capital `F` in white, success-gradient background, rounded corners, and transparent outer corners.
- Place the generator under `frontend/scripts/` and make it an explicit as-needed command rather than part of the default build pipeline.
- Document the expected generated outputs: at minimum `favicon.svg`, `favicon-32x32.png`, `favicon-16x16.png`, `apple-touch-icon.png`, `icon-192x192.png`, and `icon-512x512.png`.
- Document the expected metadata alignment: `frontend/index.html` icon links, `meta[name="theme-color"]`, and `frontend/public/manifest.json` color fields and icon entries.
- Prefer a script-driven SVG-first pipeline when implementation starts; raster files should be derivations of the same source artwork.
- Keep the contract clear: the generator updates tracked files in `frontend/public/`, and `vite build` consumes those committed assets without modifying them.

### Phase 7: Manual visual review workflow

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
- Include favicon, Apple touch icon, installed-app icon surfaces, and browser theme color in that visual review once the asset work is implemented.
- This manual review workflow is owned by the user during development; it is not part of the coding agent's implementation responsibility.

### Phase 8: Verification

- Run the lint/check enforcement from Phase 1 and treat zero violations as the main completion gate.
- Run a frontend grep that finds remaining hard-coded palette values in `.vue` and `.css` files as a secondary backstop.
- Confirm no component still references `#538d4e`, `#446cc9`, `#c94444`, raw white-alpha overlays, or the old root variable names.
- Manually verify: header, modal, toast, keyboard, tile, endgame, and stats screens still match the current dark theme.
- When the asset work is implemented, verify the generated icon set matches the documented outputs and that manifest/meta colors align with the theme variables.

## Acceptance Criteria

- No frontend component stylesheet contains hard-coded palette colors.
- No template or script path passes hard-coded palette colors or `var(--...)` color strings.
- The only palette definitions live in `frontend/src/style.css`.
- The lint/check setup added in Phase 1 passes with zero violations for the frontend.
- Variable names are semantic and functional, not hue-based.
- Shared states look intentional and consistent across tiles, keyboard, buttons, badges, scrollbars, and notifications.
- The plan explicitly covers favicon, Apple touch icon, and browser/app theme metadata as outputs of the same theme system, with documented generated assets and alignment requirements.
- The plan explicitly treats icon generation as an on-demand script under `frontend/scripts/` that writes committed assets to `frontend/public/`, while the normal frontend build only consumes those assets.
- Tech debt accepted in this issue: app startup hardcodes `data-theme="dark"`; persisted user theme preference and precedence are deferred.
