# Conversion Notes -- Eccentricity Demonstrator

## Behavior model (one paragraph)

The demonstrator shows a single ellipse and how its **eccentricity** is defined.
Two integer sliders set the **semi-major axis `a`** (range 40-100, initial 80) and
the **focal distance `c`** (range 0 to `a-1`, initial 60). The eccentricity is
`e = c / a`, displayed to three decimals (initially `60/80 = 0.750`). The ellipse
is drawn with semi-major axis `a` and semi-minor axis `b = a·√(1 − e²)`; its two
foci are marked at `±c` from the center. A red **c** arrow (center → focus) and a
blue **a** arrow (center → vertex) label the two distances. Whenever `a` changes,
`c` is re-limited to `[0, a−1]` so the eccentricity always stays below 1.

## Source files (decompiled with JPEXS)

- `scripts/frame_1/DoAction.as` -- main `update()`; `aSlider.setRange(40,100)`;
  `cSlider.setRange(0, a-1)`; `e = c/a`; `e.toFixed(3)`; the `toFixed` polyfill.
- `scripts/Ellipse Demonstration 2.as` -- ellipse geometry (`b = a·√(1−e²)`, the
  12-segment quadratic-Bezier outline, foci at `±a·e`, the two Distance Components).
- `scripts/Distance Component.as` -- the double-headed measurement arrow with
  arrowheads and end caps (`x = 1.2·√w`, `y = 0.5·x`, `h = 1.3·y`) + its label.
- `scripts/sliderV5Component.as`, `sliderV5DefaultBar.as` -- the Flash slider
  framework (observable behavior only reproduced; the widget itself is replaced by
  native controls).
- `scripts/frame_1/PlaceObject2_..._34 / _36` -- slider init blocks: `a` initValue
  80 / min 0 / max 100; `c` initValue 60 / min 0 / max 100; both linear, precision
  0 ("fixed decimal places") = integer steps.

## AS -> HTML5 mapping

| ActionScript (source of truth for behavior) | HTML5 conversion |
|---|---|
| `aSlider` (setRange 40..100, int, init 80) | native `<input type=range>` + editable `<input type=number>` `#a-range`/`#a-num`, min 40 max 100 step 1 |
| `cSlider` (range 0..a-1, int, init 60) | `#c-range`/`#c-num`, min 0, **max updated to `a-1`** in `syncControls()` |
| `update()` : `cSlider.setRange(0,a-1); e=c/a` | `clampC()` + `eccentricity()`; `refresh()` re-clamps c whenever a changes |
| `e.toFixed(3)` (custom polyfill) | verbatim `toFixed()` port in `simulation.js` |
| `EllipseDemo2.update()` ellipse + foci | `draw()` -- same `b=a·√(1−e²)`, same 12 quadratic curves, foci at `±c` |
| `Distance Component.update()` arrow | `drawDistanceArrow()` -- verbatim `x/y/h` geometry, arrowheads + end caps |
| Distance Component `Color.setRGB` tints | arrow colors (see color remaps below); labels a / c are HTML MathJax |
| `attachMovie(... _y:10 / _y:-10 ...)` | `A_ARROW_DY = 10` (a, below), `C_ARROW_DY = -10` (c, above) |
| editable value fields (`restrict "0-9..."`) | native `<input type=number>` boxes, commit on change / Enter |
| Flash slider grabber drag / bar click | native range slider (keyboard + pointer for free) |
| `onReset` initial state | `sim-reset` listener -> `a=80, c=60` |
| displayed math `e = c/a = c/a = value` | MathJax via `klunlShowEquation` (LaTeX + spoken string) |

## contents.json

The shared `foundation/contents.json` **already contains** an `ellipsedemo` entry
(title "Eccentricity Demonstrator", version 2.0, Help + About text). No edit was
required; the foundation folder is copied in byte-for-byte unchanged. `index.html`
uses `sim-id="ellipsedemo"`.

## Layout ("1 box", per request)

The whole demonstrator is rendered in **one** `.panel`, reproducing the original
single-box Flash stage: ellipse on the left, equation + sliders on the right. On
narrow / portrait widths (and at 200% zoom) the two inner columns stack in reading
order (diagram, then equation, then sliders). This matches the screenshot layout
within the KL-UNL shell.

## Deviations from the original (all presentational; behavior unchanged)

1. **Arrow / label colors remapped for contrast.** Original tints `a = 0x9090FF`
   (2.76:1 on white) and `c = 0xFF9090` (2.18:1) fail WCAG. Remapped to
   `#3538c9` (8.2:1) and `#cf2b2b` (5.2:1), preserving the blue / red identity.
   Color is never the only signal (each arrow carries its letter, and the equation
   states every value). See `ACCESSIBILITY.md`.
2. **`a` slider selectable range.** The Flash bar spanned 0-100 pixels with the
   unreachable 0-40 region shown as shading; the native slider simply uses
   `min=40 max=100` (the same *selectable* values). The `c` slider likewise uses
   `max = a-1` directly rather than shading the unreachable upper region.
3. **Native controls replace the Flash slider widget and editable fields.** Same
   values, ranges, integer stepping, and typing behavior; full keyboard support.
4. **Chrome (title bar, border, About link styling) comes from the KL-UNL shell**
   (masthead + foundation CSS), not the original pixel layout. The `astro.unl.edu`
   "Mini Link" is kept as a small link under the diagram.
5. **Line weight** raised from the 1px AS hairline to 1.5px so the outline stays
   crisp on HiDPI displays; geometry is unchanged.

No physics/logic constant, formula, range, or number format was altered.

## Known limitation (foundation-owned)

At very narrow widths (~375px and below) the shared `<kl-unl-masthead>` component's
title + button row overflows its own container by a few pixels (its buttons do not
wrap), which adds a small horizontal scroll to the page. This originates inside the
masthead's shadow DOM, which is foundation code copied in unchanged and must not be
edited; it is identical for every sim using this masthead. The sim's own content
(panel, diagram, equation, sliders) reflows cleanly with no overflow. Verified: at
1280px the layout is two-column (diagram left; equation, then c, then a on the
right); at 375px it stacks to a single column in reading order.
