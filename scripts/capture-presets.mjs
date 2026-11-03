import { chromium } from "@playwright/test";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
await mkdir("public/presets", { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(process.argv[2] || "http://localhost:5173");
  await page.getByText("Saved locally", { exact: true }).waitFor();
  const presets = await page.evaluate(async () => {
    const module = await import("/src/lib/presets.ts");
    return module.builtInPresets.map((p) => ({ id: p.id, name: p.name }));
  });
  for (const preset of presets) {
    await page
      .getByRole("button", { name: `Apply ${preset.name} preset`, exact: true })
      .click();
    const pause = page.getByRole("button", {
      name: "Pause animation",
      exact: true,
    });
    if (await pause.count()) await pause.click();
    await page.waitForFunction(
      () =>
        document.fonts.status === "loaded" &&
        [...document.querySelectorAll(".canvas-holder img")].every(
          (i) => i.complete && i.naturalWidth > 0,
        ),
    );
    await page.waitForTimeout(100);
    const buffer = await page
      .locator(".canvas-holder .cta-section")
      .screenshot();
    await sharp(buffer)
      .resize(400, 240, { fit: "cover" })
      .webp({ quality: 80 })
      .toFile(`public/presets/${preset.id}.webp`);
  }
} finally {
  await browser.close();
}
