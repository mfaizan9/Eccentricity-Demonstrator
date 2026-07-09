"use strict";
/* ============================================================================
 * Eccentricity Demonstrator  -  HTML5 / KL-UNL accessible conversion
 * Source: ellipseDemo005.swf / .fla  (astro.unl.edu), decompiled with JPEXS.
 *
 * GOAL A (functional parity): a verbatim port of the original ActionScript-1
 *   prototype classes and the main-frame update():
 *     - update():  cSlider.setRange(0, a - 1);  e = c / a;  e.toFixed(3).
 *     - aSlider.setRange(40, 100);  both sliders integer-valued (precision 0),
 *       a init 80, c init 60  ->  e = 60/80 = 0.750.
 *     - Ellipse Demonstration 2.update():  b = a * sqrt(1 - e^2); 12-segment
 *       quadratic-Bezier ellipse; foci at +/- a*e; "a" arrow length a, "c" arrow
 *       length a*e (= c).
 *     - Distance Component.update():  the double-headed measurement arrow with end
 *       caps (x = 1.2*sqrt(w), y = 0.5*x, h = 1.3*y), reproduced exactly.
 *     - toFixed() polyfill copied from the source (round-half-up).
 *
 * GOAL B (accessible KL-UNL presentation): the original canvas-drawn chrome
 *   (title, border, Flash slider widgets, editable value fields) is NOT
 *   reproduced pixel-for-pixel. The sim lives in the shared KL-UNL shell: the
 *   <kl-unl-masthead> supplies the title + Reset / Help / About; the sim is one
 *   .panel; every control is a native, fully keyboard-operable element. Only the
 *   genuinely code-drawn art (ellipse, arrows, foci) is drawn on the <canvas>.
 *   The equation e = c/a and the on-diagram variables a, c are real HTML typeset
 *   by MathJax (klunlShowEquation) so every symbol is spoken and zoomable.
 *
 * GOAL C (layout): the original was a single box with the ellipse on the left and
 *   the equation + sliders on the right; the one .panel here reproduces that,
 *   stacking to a single column on narrow / portrait widths.
 * ========================================================================== */

(function () {

  /* =========================================================================
   * SECTION 1 -- VERBATIM HELPER (toFixed polyfill from the source)
   * ======================================================================= */
  // Number.prototype.toFixed polyfill from frame_1/DoAction.as -- round-half-up.
  function toFixed(x, fractionDigits) {
    const f = parseInt(fractionDigits, 10);
    if (f < 0 || f > 20) return "Range Error";
    if (isNaN(x)) return "NaN";
    let s = "";
    if (x < 0) { s = "-"; x = -x; }
    let m = "";
    if (x < 1e21) {
      const n = Math.round(x * Math.pow(10, f));
      m = (n === 0) ? "0" : n.toString();
      if (f > 0) {
        let k = m.length;
        if (k <= f) {
          let z = "";
          for (let i = 0; i < f + 1 - k; i++) z += "0";
          m = z + m; k = f + 1;
        }
        const a = m.substr(0, k - f);
        const b = m.substr(k - f);
        m = a + "." + b;
      }
    } else {
      m = x.toString();
    }
    return s + m;
  }

  /* =========================================================================
   * SECTION 2 -- CONSTANTS
   * ======================================================================= */
  // Slider ranges / initial values (PlaceObject initialize blocks + main frame):
  //   a: setRange(40,100), integer, init 80.
  //   c: range 0..(a-1), integer, init 60.
  const A_MIN = 40, A_MAX = 100;   // aSlider.setRange(40,100)
  const C_MIN = 0;                 // cSlider lower range
  const INIT_A = 80;               // aSlider initValue
  const INIT_C = 60;               // cSlider initValue

  // Internal canvas coordinate system. The original ellipse/arrow math is in
  // "units" where 1 unit == 1 px (semi-major axis a up to 100). We keep those
  // units unchanged (no parity drift) and simply center the diagram on the canvas;
  // CSS then scales the whole canvas to fit the panel while preserving aspect.
  const BASE_W = 300, BASE_H = 260;
  const CX = 150, CY = 132;        // ellipse center (origin of the AS coordinate space)

  // Distance-component vertical offsets from the ellipse center (attachMovie _y):
  //   semi-major axis "a" arrow at _y:10 (below), focal "c" arrow at _y:-10 (above).
  const A_ARROW_DY = 10;
  const C_ARROW_DY = -10;

  // Colors. Original tints:  a = 0x9090FF (periwinkle),  c = 0xFF9090 (salmon).
  // Both fail WCAG 1.4.11/1.4.3 on white (2.76:1 and 2.18:1), so they are darkened
  // to keep >=4.5:1 for the labels and >=3:1 for the lines while preserving the
  // blue / red identity. Color is never the only signal (each arrow also carries
  // its letter a / c, and the equation states every value). See ACCESSIBILITY.md.
  const A_COLOR = "#3538c9";       // remap of 0x9090FF  (contrast 8.2:1)
  const C_COLOR = "#cf2b2b";       // remap of 0xFF9090  (contrast 5.2:1)
  const ELLIPSE_COLOR = "#1a1a1a"; // lineStyle(1,0,100) black -> --foreground-color
  const FOCUS_COLOR   = "#1a1a1a"; // the two focus "x" markers

  /* =========================================================================
   * SECTION 3 -- STATE (single source of truth)
   * ======================================================================= */
  const state = { a: INIT_A, c: INIT_C };

  // update() (frame_1/DoAction.as): c is range-limited to [0, a-1]; e = c / a.
  function clampC() {
    const cMax = state.a - 1;
    if (state.c > cMax) state.c = cMax;
    if (state.c < C_MIN) state.c = C_MIN;
  }
  function eccentricity() { return state.c / state.a; }   // e = c / a

  /* =========================================================================
   * SECTION 4 -- DOM
   * ======================================================================= */
  const canvas   = document.getElementById("ellipse-canvas");
  const ctx      = canvas.getContext("2d");
  const labelAEl = document.getElementById("label-a");
  const labelCEl = document.getElementById("label-c");
  const cNum     = document.getElementById("c-num");
  const cRange   = document.getElementById("c-range");
  const aNum     = document.getElementById("a-num");
  const aRange   = document.getElementById("a-range");
  const desc     = document.getElementById("ellipse-desc");
  const status   = document.getElementById("sr-status");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");  // no motion here, but honored for parity

  // Positions (internal coords) of the a / c variable labels, set during draw().
  const labelAPos = { x: CX, y: CY };
  const labelCPos = { x: CX, y: CY };

  /* =========================================================================
   * SECTION 5 -- CANVAS SIZING (HiDPI; stage coordinates unchanged)
   * ======================================================================= */
  function setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.round(BASE_W * dpr);
    canvas.height = Math.round(BASE_H * dpr);
    canvas.style.aspectRatio = BASE_W + " / " + BASE_H;
  }

  /* =========================================================================
   * SECTION 6 -- DRAWING (ported from Ellipse Demonstration 2 + Distance Component)
   * ======================================================================= */

  // Distance Component.update(): a horizontal double-headed arrow of length w with
  // arrowheads and vertical end caps. Drawn in a local frame whose origin is at
  // (ox, oy); the arrow runs from x=0 to x=w. Verbatim geometry.
  function drawDistanceArrow(ox, oy, w, color) {
    if (w <= 0) return;
    const x = 1.2 * Math.sqrt(w);   // arrowhead length
    const y = 0.5 * x;              // arrowhead half-height
    const h = 1.3 * y;              // end-cap half-height
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;            // slightly heavier than the AS 1px hairline for legibility on HiDPI
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    // main line
    ctx.moveTo(ox, oy);        ctx.lineTo(ox + w, oy);
    // left arrowhead
    ctx.moveTo(ox + x, oy + y); ctx.lineTo(ox, oy); ctx.lineTo(ox + x, oy - y);
    // right arrowhead
    ctx.moveTo(ox + w - x, oy + y); ctx.lineTo(ox + w, oy); ctx.lineTo(ox + w - x, oy - y);
    // end caps
    ctx.moveTo(ox, oy + h);     ctx.lineTo(ox, oy - h);
    ctx.moveTo(ox + w, oy + h); ctx.lineTo(ox + w, oy - h);
    ctx.stroke();
  }

  // A focus marker: a small "x" (leftFocusMC / rightFocusMC), drawn at (fx, oy).
  function drawFocusMarker(fx, oy) {
    const r = 4;
    ctx.strokeStyle = FOCUS_COLOR;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(fx - r, oy - r); ctx.lineTo(fx + r, oy + r);
    ctx.moveTo(fx - r, oy + r); ctx.lineTo(fx + r, oy - r);
    ctx.stroke();
  }

  function draw() {
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, BASE_W, BASE_H);

    const a = state.a;
    const e = eccentricity();
    const b = a * Math.sqrt(1 - e * e);   // b = a * sqrt(1 - e^2)
    const c = a * e;                      // focal distance (= state.c)

    // --- Ellipse (Ellipse Demonstration 2.update): 12 quadratic curves. ---
    // Center at (CX, CY); the AS draws relative to the ellipse origin. Canvas is
    // y-down like the Flash stage, so the +sin the source uses is kept as-is.
    ctx.strokeStyle = ELLIPSE_COLOR;
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const n = 12;
    const step = 6.283185307179586 / n;
    const k = 1 / Math.cos(step / 2);
    ctx.beginPath();
    ctx.moveTo(CX + a, CY);
    let cAngle = step / 2;
    let aAngle = step;
    for (let i = 0; i < n; i++) {
      const cx = a * k * Math.cos(cAngle);
      const cy = b * k * Math.sin(cAngle);
      const ax = a * Math.cos(aAngle);
      const ay = b * Math.sin(aAngle);
      ctx.quadraticCurveTo(CX + cx, CY + cy, CX + ax, CY + ay);
      cAngle += step;
      aAngle += step;
    }
    ctx.stroke();

    // --- Foci markers at +/- a*e (leftFocusMC._x, rightFocusMC._x). ---
    drawFocusMarker(CX - c, CY);
    drawFocusMarker(CX + c, CY);

    // --- "c" arrow (focal distance), above the center, length a*e = c. ---
    drawDistanceArrow(CX, CY + C_ARROW_DY, c, C_COLOR);
    // --- "a" arrow (semi-major axis), below the center, length a. ---
    drawDistanceArrow(CX, CY + A_ARROW_DY, a, A_COLOR);

    // Variable-label anchors (Distance Component centers labelField at w/2). The a
    // label sits just below its arrow (labelPlacement 4), the c label just above
    // its arrow (labelPlacement -7). Empty-length c arrow: park its label at the
    // center so it never floats detached.
    labelAPos.x = CX + a / 2;
    labelAPos.y = CY + A_ARROW_DY + 12;
    labelCPos.x = CX + (c > 0 ? c / 2 : 0);
    labelCPos.y = CY + C_ARROW_DY - 14;
    positionLabels();
  }

  // Place the (HTML, MathJax) a / c labels over the scaled canvas.
  function positionLabels() {
    const scale = canvas.clientWidth / BASE_W;
    if (!scale || !isFinite(scale)) return;
    labelAEl.style.left = (labelAPos.x * scale) + "px";
    labelAEl.style.top  = (labelAPos.y * scale) + "px";
    labelCEl.style.left = (labelCPos.x * scale) + "px";
    labelCEl.style.top  = (labelCPos.y * scale) + "px";
    labelCEl.style.visibility = (state.c > 0) ? "visible" : "hidden";
  }

  /* =========================================================================
   * SECTION 7 -- EQUATION + READOUTS (single render path)
   * ======================================================================= */
  let _lastEqn = "";
  function updateEquation() {
    const a = state.a, c = state.c;
    const eStr = toFixed(eccentricity(), 3);        // e.toFixed(3), verbatim format

    // e = c / a = c/a = value.  Constants and letters verbatim from the source.
    // Wrapped in \[ ... \] display-math delimiters so MathJax typesets it.
    const latex = "\\[ e = \\dfrac{c}{a} = \\dfrac{" + c + "}{" + a + "} = " + eStr + " \\]";
    if (latex !== _lastEqn) {
      _lastEqn = latex;
      const srMsg = "Eccentricity e equals c over a, equals " + c + " over " + a +
                    ", equals " + eStr + ".";
      klunlShowEquation(["ecc-eqn", latex], ["ecc-eqn-sr", srMsg]);
    }
  }

  // Keep every control's value + spoken text in sync with state.
  function syncControls() {
    const cMax = state.a - 1;
    // c slider/box upper bound tracks a-1 (cSlider.setRange(0, a-1)).
    cNum.max = String(cMax);
    cRange.max = String(cMax);

    aNum.value = String(state.a);
    aRange.value = String(state.a);
    cNum.value = String(state.c);
    cRange.value = String(state.c);

    // Spoken values WITH quantity name + unit (never a bare number).
    aRange.setAttribute("aria-valuetext", "semi-major axis a " + state.a + " units");
    cRange.setAttribute("aria-valuetext", "focal distance c " + state.c + " units");
  }

  function refresh() {
    clampC();
    syncControls();
    updateEquation();
    draw();
  }

  // Live-region description of the diagram (on commit, not per tick).
  function announce() {
    const eStr = toFixed(eccentricity(), 3);
    const msg = "Ellipse with semi-major axis a of " + state.a +
      " units and focal distance c of " + state.c +
      " units. The two foci are marked " + state.c +
      " units from the center. Eccentricity e equals " + eStr + ".";
    desc.textContent = msg;
    status.textContent = msg;
  }

  /* =========================================================================
   * SECTION 8 -- CONTROL WIRING
   * ======================================================================= */
  // A slider or box drives update(): set a (or c), re-clamp c to [0, a-1], redraw.
  function applyA(v, commit) {
    let a = Math.round(Number(v));
    if (!isFinite(a)) return;
    if (a < A_MIN) a = A_MIN; else if (a > A_MAX) a = A_MAX;
    state.a = a;
    refresh();
    if (commit) announce();
  }
  function applyC(v, commit) {
    let c = Math.round(Number(v));
    if (!isFinite(c)) return;
    const cMax = state.a - 1;
    if (c < C_MIN) c = C_MIN; else if (c > cMax) c = cMax;
    state.c = c;
    refresh();
    if (commit) announce();
  }

  // Sliders: 'input' updates live; 'change' commits (announce on release).
  aRange.addEventListener("input",  function () { applyA(aRange.value, false); });
  aRange.addEventListener("change", function () { applyA(aRange.value, true); });
  cRange.addEventListener("input",  function () { applyC(cRange.value, false); });
  cRange.addEventListener("change", function () { applyC(cRange.value, true); });

  // Editable number boxes (the original value fields). Commit on change / Enter.
  aNum.addEventListener("change", function () { applyA(aNum.value, true); });
  cNum.addEventListener("change", function () { applyC(cNum.value, true); });
  [aNum, cNum].forEach(function (el) {
    el.addEventListener("keydown", function (ev) { if (ev.key === "Enter") el.blur(); });
  });

  // Reset comes from the shared masthead (sim-reset event) -> exact initial state.
  function onReset() {
    state.a = INIT_A;
    state.c = INIT_C;
    refresh();
    announce();
  }
  document.addEventListener("sim-reset", onReset);

  // Keep the labels aligned (and backing crisp) on resize / zoom.
  window.addEventListener("resize", function () { setupCanvas(); draw(); });

  /* =========================================================================
   * SECTION 8b -- KEEP MATHJAX OUT OF THE TAB ORDER
   * ======================================================================= */
  // With the menu enabled, MathJax makes every mjx-container focusable
  // (tabindex="0"), which would drop the decorative a / c labels and the
  // aria-hidden equation into the tab order. Force tabindex="-1" on the sim's
  // MathJax containers; right-click still opens the MathJax menu (untouched).
  function suppressMathTabstops() {
    document.querySelectorAll("mjx-container[tabindex]").forEach(function (c) {
      if (c.getAttribute("tabindex") !== "-1") c.setAttribute("tabindex", "-1");
    });
  }
  const _mjxObserver = new MutationObserver(suppressMathTabstops);
  _mjxObserver.observe(document.body, {
    childList: true, subtree: true, attributes: true, attributeFilter: ["tabindex"]
  });

  /* =========================================================================
   * SECTION 9 -- BOOT
   * ======================================================================= */
  // Redefine the foundation hook (per the KL-UNL contract) to initialize the eqn.
  window.klunlInitEqn = function () { _lastEqn = ""; updateEquation(); };

  let _booted = false;
  function boot() {
    if (_booted) return;
    _booted = true;
    setupCanvas();
    refresh();
    announce();
    suppressMathTabstops();
  }

  // Boot once MathJax is ready (so the equation + a / c labels are typeset), with
  // fallbacks if MathJax is slow or unavailable.
  if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) {
    window.MathJax.startup.promise.then(boot, boot);
  } else if (document.readyState !== "loading") {
    boot();
  } else {
    document.addEventListener("DOMContentLoaded", boot);
  }
})();
