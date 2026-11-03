import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const target = process.argv[2];
if (!target || !target.startsWith("https://"))
  throw new Error("Pass the public HTTPS deployment URL.");
const browser = await chromium.launch({
  channel: process.env.CI ? undefined : "chrome",
});
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const response = await page.goto(target);
  await page.getByText("Saved locally", { exact: true }).waitFor();
  await page.waitForFunction(
    () =>
      document.fonts.status === "loaded" &&
      [...document.images].every((i) => i.complete && i.naturalWidth > 0),
  );
  const room = page.locator(".canvas-holder .cta-world");
  const before = await room.evaluate((el) => getComputedStyle(el).transform);
  await page.locator(".canvas-holder").hover({ position: { x: 80, y: 90 } });
  await page.waitForTimeout(300);
  const after = await room.evaluate((el) => getComputedStyle(el).transform);
  if (before === after)
    throw new Error("Pointer motion did not update the room.");
  await page.locator('[aria-controls="group-motion"]').click();
  await page.getByLabel("Shuffle interval", { exact: true }).fill("1");
  const first = page.locator(".canvas-holder .cta-tile img").last();
  const firstSource = await first.getAttribute("src");
  await page.waitForFunction(
    (source) => {
      const images = [
        ...document.querySelectorAll(".canvas-holder .cta-tile img"),
      ];
      return images.at(-1)?.getAttribute("src") !== source;
    },
    firstSource,
    { timeout: 5000 },
  );
  const footer = await page
    .getByRole("link", { name: "@karimsif" })
    .evaluate((el) => ({ href: el.href, target: el.target, rel: el.rel }));
  if (
    footer.href !== "https://x.com/karimsaif0" ||
    footer.target !== "_blank" ||
    !footer.rel.includes("noopener")
  )
    throw new Error("Footer branding link is incorrect.");
  if (errors.length)
    throw new Error(`Browser console errors: ${errors.join("; ")}`);
  await page.getByRole("button", { name: "Reset design", exact: true }).click();
  await page.locator(".workspace-heading").hover();
  await page.waitForTimeout(300);
  await mkdir("research", { recursive: true });
  await page.screenshot({
    path: "research/public-production.png",
    fullPage: true,
  });
  const result = {
    url: target,
    status: response.status(),
    parallax: true,
    imageAnimation: true,
    footer,
    consoleErrors: errors,
    verifiedAt: new Date().toISOString(),
  };
  await writeFile(
    "research/public-verification.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
