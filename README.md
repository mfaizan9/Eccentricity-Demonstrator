# Eccentricity Demonstrator (HTML5 / KL-UNL)

An accessible HTML5 re-creation of the Flash *Eccentricity Demonstrator*
(`ellipseDemo005.swf`, astro.unl.edu), built on the shared KL-UNL foundation.

## It must be served over HTTP -- double-clicking `index.html` will NOT work

**Why:** the KL-UNL masthead (`foundation/kl-unl-masthead.js`) loads its title and
About/Help text with `fetch('foundation/contents.json')`. Browsers block `fetch()`
of local files under the `file://` protocol (same-origin policy), so opening the
page directly shows an empty or broken masthead. Served over HTTP the fetch
succeeds and the sim loads normally.

## How to run locally

Run one of these from **inside this `html5/` folder**, then open the printed URL:

```
Python:  python3 -m http.server 8123      # then open http://localhost:8123/
Node:    npx serve                         # (or: npx http-server)
VS Code: the "Live Server" extension
```

Because you serve from inside `html5/`, the sim is at the server root -- the URL is
`http://localhost:8123/`, not `.../html5/index.html`.

## Production

When deployed to the cloud host (served over HTTP/HTTPS) it just works; the
`file://` limitation only affects local double-clicking.

## What's here

```
index.html          KL-UNL scaffold: masthead + one panel (ellipse + equation + sliders)
foundation/         KL-UNL foundation, copied in UNCHANGED (masthead, css, js, contents.json)
styles/styles.css   sim-specific styles only (foundation is never edited)
simulation.js       all sim logic (verbatim AS port + accessible controls)
assets/mathjax/     MathJax, vendored locally (no CDN at runtime)
CONVERSION_NOTES.md  behavior model, AS -> HTML5 mapping, deviations
ACCESSIBILITY.md     WCAG affordances, color remaps, keyboard map, live-region wording
```

No build step, no bundler, no framework, no CDN. All files are local.
