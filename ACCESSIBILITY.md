# Accessibility Notes -- Eccentricity Demonstrator

Target: WCAG 2.1 AA (AAA where reasonable). Built on the KL-UNL foundation, which
supplies the palette, focus handling, responsive grid, and the masthead dialog.
**Human screen-reader QA (NVDA + VoiceOver) is still required.**

## Structure & semantics

- One `<h1>` -- the sim title -- is rendered by the `<kl-unl-masthead>` component;
  the sim adds no competing `h1`. The single panel has an `<h2>` heading; a visually
  hidden `<h3>` labels the controls group.
- Landmarks: `<main>` wraps the panel; `<section>` for the panel; the masthead
  provides the `<header>`/`<nav>`.
- A "Skip to controls" link is the first focusable element.
- `<html lang="en">`.

## Text alternatives

- The `<canvas>` has `role="img"` + `aria-label` and an `aria-describedby`
  (`#ellipse-desc`) that is kept in sync with the diagram state ("Ellipse with
  semi-major axis a of 80 units and focal distance c of 60 units. The two foci are
  marked 60 units from the center. Eccentricity e equals 0.750.").
- The equation carries a spoken description via `klunlShowEquation`'s message arg.

## Math (MathJax)

- The equation `e = c/a = 60/80 = 0.750` and the on-diagram variables **a** and
  **c** are real HTML typeset by MathJax (SVG output, vendored locally). No math is
  drawn on the canvas or shown as a raster/ASCII.
- Right-clicking any symbol opens the MathJax context menu ("Show Math As...").
  The menu is left enabled and untouched. The sim only sets `tabindex="-1"` on its
  MathJax containers so they don't clutter the tab order -- right-click still works.

## Color & contrast

- The two arrow tints were remapped from the original low-contrast pastels to meet
  WCAG 1.4.3 / 1.4.11:
  | element | original | remapped | contrast on white |
  |---|---|---|---|
  | `a` arrow + label (blue) | `#9090FF` (2.76:1) | `#3538c9` | 8.2:1 |
  | `c` arrow + label (red)  | `#FF9090` (2.18:1) | `#cf2b2b` | 5.2:1 |
- Ellipse outline and focus markers use `#1a1a1a` (foreground) on white.
- **Color is never the only signal:** the blue arrow is always labeled *a*, the red
  arrow *c*, and the equation states `a`, `c`, and `e` numerically.

## Keyboard

- Every control is a native element in a logical tab order with the foundation's
  visible `:focus-visible` ring. No keyboard traps; the masthead dialog manages its
  own focus.
- **Sliders are fully keyboard-operable** (native `<input type="range">`):
  Left/Down decrement, Right/Up increment, Page Up/Page Down larger steps,
  Home/End jump to min/max. The `c` slider's max follows `a-1` automatically.
- The editable number boxes accept typed values and commit on change / Enter --
  the keyboard equivalent of the original editable fields. There is no
  mouse-only drag target on the canvas, so no separate canvas keyboard proxy is
  needed (both sliders already move every quantity).

## Screen-reader narration (units always spoken)

- Every value is announced **with its quantity name and unit**, never a bare number:
  - `a` slider `aria-valuetext` = "semi-major axis a 80 units"
  - `c` slider `aria-valuetext` = "focal distance c 60 units"
  - number boxes have `aria-label` "Semi-major axis a, in units" / "Focal distance
    c, in units".
- Eccentricity `e` is a dimensionless ratio and is announced as a plain value
  ("Eccentricity e equals 0.750").
- An `aria-live="polite"` status region (`#sr-status`, plus the canvas description
  `#ellipse-desc`) announces the full state **on commit** (slider release, box
  change, Reset) -- not on every tick -- so announcements don't flood.

## Timing / motion

- The sim has no continuous animation (the diagram redraws instantly from state),
  so no Pause control is needed and nothing flashes. `prefers-reduced-motion` is
  honored by design (there is no motion to reduce).

## Responsiveness / touch

- The single panel's two inner columns collapse to one stacked column below the
  foundation breakpoint and again at `max-width: 40rem` (phone portrait / 200%
  zoom); no horizontal scroll, nothing clipped.
- The canvas keeps its original internal coordinates and scales via CSS with a
  preserved aspect ratio; the a / c labels are re-projected through the live scale.
- Touch targets meet >= 44px (2.75rem). No hover-only affordances. `touch-action`
  on the canvas prevents scroll/zoom hijack.
