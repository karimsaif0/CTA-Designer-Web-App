# Public release

- Repository: https://github.com/karimsaif0/CTA-Designer-Web-App
- Production: https://cta-designer-web-app.vercel.app
- Owner: Karim Saif / karimsaif0
- Production branch: main
- Framework: Vite
- Node.js: 24.x
- Install: npm ci
- Build: npm run build
- Output: dist
- Application environment variables: none

The Vercel project is connected to this GitHub repository. Pushes to main trigger production deployment. The site is accessible without signing in to Vercel.

Release verification includes a fresh clone from the public repository, lockfile install, strict TypeScript, lint, 13 unit tests, production build, 22 browser tests against the public HTTPS origin, and an independent build of the downloaded React project. Browser tests cover uploads, all exposed controls, projects, presets, exports, footer, responsive layouts and reduced motion. Additional public verification checks actual pointer-driven room transforms, automatic image changes and browser console errors.

The initial Linux CI run exposed a test synchronization issue: background input was filled before an asynchronous project-switch dialog closed. The test now waits for that dialog to close before editing the new project. This preserves the intended user workflow across platforms.

The initial public console check also found a missing favicon request. A bundled original SVG favicon resolves that resource without introducing a remote dependency.

No backend, Toolcraft process, local filesystem service, AI API or paid subscription is needed. Browser projects are origin-specific; JSON export/import moves a project between installations. Uploaded media remains local to that browser. Physical device, Safari, Firefox and screen-reader testing remain outside the automated Chrome/Chromium coverage.
