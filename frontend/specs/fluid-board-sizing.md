# Fluid Square Board Sizing Plan

## Goal

Make the game board's letter tiles **square** and **fluidly fill the available
vertical space** inside `<main>`, at every viewport size — eliminating the
current step-wise `@media` breakpoint jumps in `LetterTile.vue` that produce
inconsistent tile sizes and padding between breakpoints.

The board must remain correct whether or not the **challenge ribbon** is shown
(it only appears for shared/challenge games and can wrap on narrow screens).

## Chosen Approach: JS-measured (ResizeObserver)

Measure the **grid container element** with a `ResizeObserver`, compute a square
tile size from the actually-available box, and expose it as a CSS variable
(`--tile-size`) that the tiles consume. Observing the grid (not `<main>`) means
the ribbon's presence, size, and wrapping are automatically accounted for by
normal flex layout before measurement — no hard-coded ribbon height.

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
- `.game-grid`: add `flex: 1; min-height: 0;` and `justify-content: center;` so
  it occupies the remaining height and stays centered within it. It keeps
  `display: flex; flex-direction: column; gap: 5px`.

Gaps to keep in the math: 5px between the 6 rows and 5px between the N columns.

## Sizing Computation

Measure the grid container's content box (`width`, `height`). With:

- `cols = wordLength` (4, 5, or 6), `rows = 6`, `gap = 5`px.

Compute:

```
heightFit = (height - (rows - 1) * gap) / rows
widthFit  = (width  - (cols - 1) * gap) / cols
raw       = Math.min(heightFit, widthFit)
tileSize  = Math.floor(clamp(MIN, raw, MAX))   // integer px avoids subpixel blur
```

Suggested clamps: `MIN = 28`, `MAX = 88`.

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
   - Add a `ref` on the `.game-grid` element (e.g. `gridEl`).
   - In `onMounted`, create a `ResizeObserver` that reads
     `entry.contentRect` (or `getBoundingClientRect`) of the grid and runs the
     sizing computation, updating `tileSize`.
   - Observe `gridEl`. Also call the compute once after first paint
     (`requestAnimationFrame` or `nextTick`) so the initial size is correct.
   - Disconnect the observer in `onUnmounted`.
   - Apply the layout restructure CSS described above.
   - Recompute on `wordLength` change (watch) and ensure it also recomputes when
     the ribbon toggles (`isSharedGame`) — toggling the ribbon resizes the grid,
     so the observer will fire automatically; no extra code needed, but verify.

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
