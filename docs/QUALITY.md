# Verification — 2026-11-03

## Automated checks

| Check | Result |
| --- | --- |
| Strict TypeScript | Pass |
| ESLint + React Hooks rules | Pass, no remaining warnings |
| Vitest | 13 tests pass |
| Playwright / Chrome | 22 tests pass (full suite rerun after final UI changes) |
| Production Vite build | Pass |
| Downloaded React project | Independent npm install, TypeScript check and Vite production build pass |
| npm audit, including development dependencies | 0 vulnerabilities |
| axe WCAG 2 A/AA + desktop WCAG 2.1 AA rules | No violations on tested default desktop surface |
| axe responsive audits | No WCAG 2 A/AA violations at 320, 390, 768, 1024 pixels |
| Browser runtime errors | None in checked load, exported runtime and profiling workflows |

The browser suite changes every exposed property field and verifies the saved configuration. It covers live room geometry, undo/redo, headline changes, persistence across reloads, raster upload/replacement/reorder/deletion, malformed image rejection, incompatible JSON rejection, custom preset save/rename/duplicate/delete/export, Apply snapshots, manual image assignment, complete React downloads, JSON round trips, offline standalone HTML, real PNG files, editor navigation suppression, preview navigation, project management, modal keyboard focus/escape, OS reduced motion and responsive layout.

Visual fidelity is checked by exporting the paused composition to standalone HTML, rendering it at the same dimensions and comparing decoded pixels. The mean absolute normalized channel difference is required to stay below 0.025; the check passes. Both surfaces use the same actual runtime source. This test does not claim that animations will have identical time phase when opened separately or that independently sized containers have identical framing.

Screenshots were visually reviewed for the desktop editor, narrow phone layout, PNG export, standalone output and matching-size export comparison. The initial nested interactive thumbnail issue and mobile inspector/action-bar overlap were fixed. All preset thumbnails are now non-interactive captures inside labeled preset buttons. Custom preset live thumbnails are inert.

## Performance

Measured using `node scripts/profile.mjs http://localhost:4173` against the production preview. Chrome 155.0.8059.85, 1440 × 1000, a 42-image-tile main composition, bundled sample assets, 1200 ms warm-up and 179 measured animation frame intervals with pointer motion. The raw report is in `performance.json`.

| Metric | Measured |
| --- | --- |
| Initial JavaScript | 118.83 KB gzip |
| Editor CSS | 8.02 KB gzip |
| Export code (loaded when requested) | 46.35 KB gzip |
| Mean frame interval | 6.98 ms |
| 95th percentile frame interval | 7.10 ms |
| Maximum sampled frame interval | 13.80 ms |
| JavaScript tasks >50 ms during sample | 0 |
| DOM elements | 837 |
| Reported JS heap | 5.28 MB |
| Runtime errors | 0 |

Budgets for this desktop sample: initial JS below 150 KB gzip, editor CSS below 15 KB gzip, 95th percentile frame interval below 24 ms and no JavaScript task over 50 ms during the interaction sample. All pass. Headless frame cadence depends on host/GPU conditions and is not a guarantee of any physical device's refresh rate.

The first profile exposed expensive composition from seven additional live CSS 3D preset rooms. Built-in preset previews now use small WebP captures generated from the actual renderer with `scripts/capture-presets.mjs`; custom presets retain inert live previews. DOM count fell from 1485 to 837 and the final interaction profile passed the frame budget. Original artwork is bounded to 600 pixels, uploaded images to a 1600-pixel edge, library size to 60 assets / approximately 50 MB encoded, history to 60 groups. Thumbnails never animate; OS/project reduced motion and hidden-document states suspend animation. Resize observers, timers and animation frames clean up on unmount.

## Scope and practical limits

- The Toolcraft case study was readable; its live demo returned a blank page in automated Chrome, so that interface's exact behavior could not be inspected. No source/assets were copied.
- Apply implements standalone browser project saving. An optional trusted local filesystem service was not added. The browser cannot modify arbitrary website projects; use React/HTML export.
- Testing used desktop Chrome and responsive viewport emulation on this Windows machine. Safari, Firefox, physical touchscreen hardware, real screen readers, printer behavior and cloud deployment were not tested. The public release and production verification are documented in [RELEASE.md](RELEASE.md).
- Browser storage is origin-specific and can be cleared or denied by the user/browser. Save errors are reported, and JSON export provides a portable backup. Undo/redo history does not persist across reloads.
- CSS 3D is the only room renderer; WebGL-specific texture disposal, DPR settings and context-loss handling are inapplicable. PNG capture works with the bundled/local raster assets in the tested browser. Arbitrary remote images and SVG uploads are not accepted.
- Build output may include non-fatal upstream Zod annotation warnings. The generated Vite export may warn that `use client` is ignored, which is expected for a client-only Vite bundle. Neither prevents successful TypeScript or production builds.

## UI Skills finish gate

No remaining actionable high-severity polish finding was observed on the tested surfaces. Checked controls, selected/disabled states, visible focus, native modal focus containment, keyboard return, reduced motion, static cues, border/radius consistency, explicit transition properties, image outlines and responsive layouts. The real-browser axe and visual checks above support this scoped approval. Browser Animations-panel playback at 10% speed and untested assistive technologies remain **not verified**.
