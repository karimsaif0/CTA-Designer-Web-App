import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome" });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(process.argv[2] || "http://localhost:4173");
  await page.waitForFunction(
    () =>
      document.fonts.status === "loaded" &&
      [...document.images].every((i) => i.complete && i.naturalWidth > 0),
  );
  await page.waitForTimeout(1200);
  const metrics = await page.evaluate(async () => {
    const longTasks = [];
    const observer = new PerformanceObserver((list) =>
      longTasks.push(...list.getEntries().map((e) => e.duration)),
    );
    observer.observe({ type: "longtask", buffered: false });
    const times = [];
    let last = 0;
    const root = document.querySelector(".canvas-holder .cta-section");
    const rect = root.getBoundingClientRect();
    await new Promise((resolve) => {
      let frames = 0;
      function frame(time) {
        if (last) times.push(time - last);
        last = time;
        root.dispatchEvent(
          new PointerEvent("pointermove", {
            bubbles: true,
            clientX:
              rect.left + rect.width * (0.5 + 0.4 * Math.sin(frames / 20)),
            clientY:
              rect.top + rect.height * (0.5 + 0.4 * Math.cos(frames / 30)),
            pointerType: "mouse",
          }),
        );
        if (++frames < 180) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });
    observer.disconnect();
    const sorted = [...times].sort((a, b) => a - b);
    return {
      frames: times.length,
      meanFrameMs: times.reduce((a, b) => a + b, 0) / times.length,
      p95FrameMs: sorted[Math.floor(sorted.length * 0.95)],
      maxFrameMs: Math.max(...times),
      longTasksOver50ms: longTasks.length,
      totalLongTaskMs: longTasks.reduce((a, b) => a + b, 0),
      domElements: document.querySelectorAll("*").length,
      mainCanvasTiles: root.querySelectorAll(".cta-tile").length,
      heapMB: performance.memory
        ? performance.memory.usedJSHeapSize / 1048576
        : null,
      resources: performance.getEntriesByType("resource").map((r) => ({
        name: new URL(r.name).pathname,
        bytes: r.transferSize,
      })),
    };
  });
  const report = {
    testedAt: new Date().toISOString(),
    viewport: "1440 × 1000",
    browser: await browser.version(),
    ...metrics,
    consoleErrors: errors,
  };
  await mkdir("research", { recursive: true });
  await writeFile("research/performance.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
