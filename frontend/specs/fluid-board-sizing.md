# Fluid Square Board Sizing Plan

## Goal

Make the game board's letter tiles **square** and **fluidly fill the available
vertical space** inside `<main>`, at every viewport size — eliminating the
current step-wise `@media` breakpoint jumps in `LetterTile.vue` that produce
inconsistent tile sizes and padding between breakpoints.

The board must remain correct whether or not the **challenge ribbon** is shown
(it only appears for shared/challenge games and can wrap on narrow screens).

## Chosen Approach: JS-measured (ResizeObserver)

Measure the available board box with a `ResizeObserver`, compute a square tile
size from it, and expose it as a CSS variable (`--tile-size`) that the tiles
consume.

> **IMPORTANT — observe the parent, not the grid.** Observe **`.board-stage`**
> (the flex parent) and derive the grid's available box from it. Do **not**
> observe `.game-grid` directly. The grid's own height is driven by its content
> — and that content height _is_ `--tile-size` — so observing the grid creates a
> feedback loop: tiles can grow (overflowing the flex box) but the observer
> never sees the box shrink back, so tiles never grow back when the viewport
> expands. `.board-stage` is sized purely by flex layout (`flex: 1`),
> independent of `--tile-size`, so both grow and shrink are detected reliably.
>
> Because we observe the parent, the **challenge ribbon's** rendered height is
> subtracted explicitly in the computation (see _Sizing Computation_) rather
> than being absorbed implicitly by flex. This is intentional and keeps the
> measurement decoupled from tile content.

Do **not** use the pure-CSS `min()`/`calc()` route; it cannot cleanly subtract
the sibling ribbon's rendered height while keeping tiles square.

## Current State (before this change)

- `frontend/src/App.vue`
  - `main` is `flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; overflow: hidden`.
  - `.board-stage` is `display: flex; flex-direction: column; align-items: center; gap: 10px; width: 100%`.
  - `.challenge-ribbon` renders conditionally (`v-if="isSharedGame"`) as the first child of `.board-stage`, above `.game-grid`.
  - `.game-grid` is `display: flex; flex-direction: column; gap: 5px`, with inline `:style="gridStyle"`.
  - `gridStyle` comes from `useGame.js` and currently only sets `--cols`.
  - `.row` is `display: flex; gap: 5px`.
- `frontend/src/composables/useGame.js`
  - `const gridStyle = computed(() => ({ "--cols": wordLength.value }));` (around line 200).
- `frontend/src/components/LetterTile.vue`
  - Fixed `width: 80px; height: 80px; font-size: 2.5rem; border: 2px`.
  - Four responsive breakpoints shrink the tile: `max-height: 925px` (76px),
    `862px` (66px), `802px` (50px), `742px` (40px) — these cause the step jumps.
  - `.count-badge` is a fixed 16px circle bottom-right.

## Required Layout Restructure (App.vue)

So the grid receives the leftover space after the ribbon:

- `main`: keep `flex: 1; min-height: 0; overflow: hidden`. Change
  `align-items: center` -> `align-items: stretch` so `.board-stage` can take
  full height. Keep `justify-content: center` (or remove; the stage will fill).
- `.board-stage`: add `flex: 1; min-height: 0;` (keep `flex-direction: column`,
  `align-items: center`, `gap: 10px`, `width: 100%`).
- `.challenge-ribbon`: ensure it does not grow — add `flex: 0 0 auto;`.
- `.board-stage`: ALSO add `justify-content: center;` and a small vertical
  `padding` (e.g. `12px 0`) so the ribbon+grid group is centered between the
  header and footer (prevents the ribbon from being pinned against the header).
  The padding is subtracted in the measurement.
- `.game-grid`: use `flex: 0 1 auto; min-height: 0;` and
  `justify-content: center;`. It sizes to its content (the tiles) rather than
  greedily filling the stage — this lets `.board-stage`'s `justify-content:
center` center the ribbon+grid as a single group. (Using `flex: 1` here
  instead pins the ribbon to the top and leaves an awkward gap above the
  board, especially once tiles are sized.) It keeps `display: flex;
flex-direction: column; gap: 5px`.

Gaps to keep in the math: 5px between the 6 rows and 5px between the N columns.

## Sizing Computation

Derive the grid's available box from the **parent (`.board-stage`)** rather than
measuring the grid itself:

- Read the parent's `clientWidth` / `clientHeight` (border-box minus scrollbars).
- Subtract the parent's horizontal/vertical padding (via `getComputedStyle`).
- If the **challenge ribbon** is present, subtract its rendered height
  (`ribbon.getBoundingClientRect().height`) **and** the parent's `row-gap`
  (the 10px stage gap) once.

This yields `availW` / `availH` — the box the grid actually occupies. Then with:

- `cols = wordLength` (4, 5, or 6), `rows = 6`, `gap = 5`px.

Compute:

```
heightFit = (availH - (rows - 1) * gap) / rows
widthFit  = (availW - (cols - 1) * gap) / cols
raw       = Math.min(heightFit, widthFit)
tileSize  = Math.floor(Math.max(MIN, raw))     // integer px avoids subpixel blur
```

**No upper bound.** Tiles fill whatever space is available; `min(heightFit,
widthFit)` already guarantees the board fits its box. Keep only a lower bound
(`MIN = 28`) so tiles never shrink to an unusable size / overflow on tiny
screens.

Expose results so tiles and proportional details scale together:

- `--tile-size: ${tileSize}px`
- font, border, radius, and badge derive from `--tile-size` in CSS (see below),
  so no extra variables are strictly required, but you MAY also expose
  `--tile-font: calc(var(--tile-size) * 0.45)` if you prefer.

## Implementation Steps

1. **useGame.js**
   - Add a reactive `tileSize` ref (default e.g. 60).
   - Extend `gridStyle` to also emit `"--tile-size": \`${tileSize.value}px\``alongside the existing`"--cols"`.
   - Export `tileSize` (and a setter or just the ref) so `App.vue` can update it,
     OR keep the ResizeObserver entirely in `App.vue` and have it write a local
     ref that is merged into the style. Simplest: keep `gridStyle` as the single
     source of truth and update a `tileSize` ref that `gridStyle` reads.
   - Recompute is driven by the observer (below), but also recompute when
     `wordLength` changes (column count affects `widthFit`). A `watch` on
     `wordLength` that re-runs the measurement is sufficient, or just let the
     observer fire — note changing columns may not resize the container, so an
     explicit recompute on `wordLength` change is safer.

2. **App.vue**
   - Add a `ref` on the `.game-grid` element (e.g. `gridEl`); the computation
     reaches its parent via `gridEl.value.parentElement` (`.board-stage`).
   - Implement `computeTileSize()` that derives `availW`/`availH` from the
     **parent** (`.board-stage`) as described in _Sizing Computation_, then
     calls `setTileSize(Math.floor(clamp(...)))`.
   - In `onMounted`, create a `ResizeObserver` whose callback defers the compute
     to the next frame via `requestAnimationFrame(computeTileSize)`. Deferring
     avoids "ResizeObserver loop completed with undelivered notifications"
     warnings, since the callback writes a CSS var that affects layout.
   - **Observe `gridEl.value.parentElement`** (the `.board-stage`), NOT
     `gridEl` itself — see the IMPORTANT note in _Chosen Approach_ for why.
   - Also call the compute once after first paint
     (`nextTick` + `requestAnimationFrame`) so the initial size is correct.
   - Disconnect the observer in `onUnmounted`.
   - Apply the layout restructure CSS described above.
   - Recompute on `wordLength` change (watch). Ribbon toggles (`isSharedGame`)
     resize `.board-stage`, so the observer fires automatically; no extra code
     needed, but verify.

3. **LetterTile.vue**
   - Replace fixed sizing with:
     - `width: var(--tile-size); height: var(--tile-size);` (or
       `width: var(--tile-size); aspect-ratio: 1;`).
     - `font-size: calc(var(--tile-size) * 0.45);`
     - `border-width: max(1px, calc(var(--tile-size) * 0.03));` (keep color/style).
     - `border-radius: max(3px, calc(var(--tile-size) * 0.06));`
   - Scale `.count-badge` proportionally:
     - `width`/`height`: `calc(var(--tile-size) * 0.26)` (min ~12px),
       `font-size: calc(var(--tile-size) * 0.2)`.
   - **Delete all four `@media` breakpoint blocks** that set width/height/font.
   - Note: `--tile-size` is set on `.game-grid` (via `gridStyle`); since
     `LetterTile` is a descendant, the variable inherits down through `.row`.

## Edge Cases & Verification

- **Challenge ribbon shown vs. hidden:** tiles must shrink slightly when the
  ribbon is present and grow back when absent, with no overflow/scroll. Toggle a
  shared (`?d=`/`?r=`) game vs. a normal game to verify.
- **Word length 4/5/6:** verify squareness and that width never overflows on
  narrow screens (6-col is the tightest).
- **Symmetric grow/shrink:** tiles must shrink when the viewport shrinks AND
  grow back when it expands. (Observing the grid directly breaks the grow-back
  case — see the IMPORTANT note in _Chosen Approach_.) Test by squeezing and
  re-expanding the window vertically and horizontally.
- **Mobile dynamic viewport (`dvh`) / URL bar show-hide:** the observer should
  refire and keep tiles fitting.
- **Orientation change:** verify recompute.
- **Endgame state:** the board is unchanged at endgame, but confirm the grid
  still has a measured size before the footer switches to endgame layout.
- **Integer sizing:** floor tile size to avoid subpixel blur; confirm rows stay
  centered with `justify-content: center` on `.game-grid`.
- **No regression to keyboard:** keyboard sizing in `VirtualKeyboard.vue` is
  independent; leave its rules as-is.

## Out of Scope

- Keyboard fluid sizing (separate concern).
- Endgame meanings/buttons layout.
- Any color/theme changes.
