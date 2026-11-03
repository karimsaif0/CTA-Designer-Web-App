import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import JSZip from "jszip";
import { fields } from "../src/components/controls";
import { defaultConfig } from "../src/runtime/config";
import type { Config } from "../src/runtime/config";
import sharp from "sharp";
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Saved locally", { exact: true })).toBeVisible();
});

test("every exposed design control updates the validated project configuration", async ({
  page,
}) => {
  test.setTimeout(120000);
  const expected = structuredClone(defaultConfig);
  for (const [group, properties] of Object.entries(fields)) {
    const container = page.locator(`#group-${group}`);
    if (!(await container.isVisible()))
      await page.locator(`[aria-controls="group-${group}"]`).click();
    for (const field of properties) {
      const input = container.getByLabel(field.label, { exact: true });
      const values = expected[group as keyof Config] as unknown as Record<
        string,
        unknown
      >;
      let value: unknown;
      if (field.type === "toggle") {
        value = !values[field.key];
        await input.setChecked(Boolean(value));
      } else if (field.type === "color") {
        value = "#9ab18b";
        await input.fill(String(value));
      } else if (field.type === "select") {
        value = field.options![field.options!.length - 1];
        await input.selectOption(String(value));
      } else if (field.type === "text" || field.type === "textarea") {
        value =
          field.key === "url"
            ? "https://example.com/verified"
            : `Verified ${field.label}`;
        await input.fill(String(value));
        await input.blur();
      } else {
        const min = field.min || 0,
          step = field.step || 1;
        value = Number((min + step * 2).toFixed(3));
        await input.fill(String(value));
      }
      values[field.key] = value;
    }
  }
  await expect(page.getByText("Saved locally", { exact: true })).toBeVisible();
  const stored = await page.evaluate(
    () =>
      new Promise<unknown>((resolve, reject) => {
        const request = indexedDB.open("cta-designer", 1);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db
            .transaction("projects")
            .objectStore("projects")
            .get(localStorage.getItem("cta-active-project")!);
          tx.onsuccess = () => {
            resolve(tx.result.config);
            db.close();
          };
          tx.onerror = () => reject(tx.error);
        };
        request.onerror = () => reject(request.error);
      }),
  );
  expect(stored).toEqual(expected);
  await expect(page.locator(".canvas-holder h2")).toHaveText(
    "Verified Headline",
  );
});
test("loads a real room with the correct branding and no runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.reload();
  await expect(page.locator(".canvas-holder .cta-plane")).toHaveCount(5);
  expect(
    await page.locator(".canvas-holder .cta-tile").count(),
  ).toBeGreaterThan(15);
  await expect(page.getByRole("link", { name: "@karimsif" })).toHaveAttribute(
    "href",
    "https://x.com/karimsaif0",
  );
  await page.screenshot({
    path: "research/desktop-verified.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("controls change live geometry and undo/redo works", async ({ page }) => {
  const depth = page.getByLabel("Depth", { exact: true });
  await depth.fill("2200");
  await expect(page.locator('.canvas-holder [data-surface="rear"]')).toHaveCSS(
    "transform",
    /.*-2200.*/,
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(depth).toHaveValue("1600");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(depth).toHaveValue("2200");
});
test("typography, presets, save and reload share the same state", async ({
  page,
}) => {
  await page
    .getByRole("button", {
      name: "Apply Minimal Editorial preset",
      exact: true,
    })
    .click();
  await expect(page.locator(".canvas-holder h2")).toContainText("A different");
  await page
    .getByRole("button", { name: "Typography", exact: false })
    .first()
    .click();
  await page
    .getByLabel("Headline", { exact: true })
    .fill("A saved perspective");
  await expect(page.locator(".canvas-holder h2")).toHaveText(
    "A saved perspective",
  );
  await page
    .getByLabel("Project name", { exact: true })
    .fill("Persistent exploration");
  await expect(page.getByText("Saved locally", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator(".canvas-holder h2")).toHaveText(
    "A saved perspective",
  );
  await expect(page.getByLabel("Project name", { exact: true })).toHaveValue(
    "Persistent exploration",
  );
});
test("uploads, replaces, reorders and removes a raster image", async ({
  page,
}) => {
  await page
    .getByLabel("Upload images", { exact: true })
    .setInputFiles("public/art/art-0.webp");
  await expect(page.locator(".asset-item")).toHaveCount(9);
  await page
    .getByRole("button", { name: "Move art-0.webp earlier", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Replace art-0.webp", exact: true })
    .click();
  await page
    .getByLabel("Replace image", { exact: true })
    .setInputFiles("public/art/art-1.webp");
  await expect(
    page.getByRole("button", { name: "Remove art-1.webp", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Remove art-1.webp", exact: true })
    .click();
  await expect(page.locator(".asset-item")).toHaveCount(8);
});
test("rejects a disguised upload and unsafe imported projects", async ({
  page,
}) => {
  await page.getByLabel("Upload images", { exact: true }).setInputFiles({
    name: "fake.png",
    mimeType: "image/png",
    buffer: Buffer.from('<svg onload="alert(1)"/>'),
  });
  await expect(page.getByRole("status")).toContainText("contents do not match");
  await expect(page.locator(".asset-item")).toHaveCount(8);
  await page
    .getByRole("button", { name: "Open projects", exact: true })
    .click();
  await page.getByLabel("Import project file").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":99}'),
  });
  await expect(page.getByRole("alert")).toContainText(
    "Could not import project",
  );
});
test("saves, renames, duplicates, exports and deletes custom presets", async ({
  page,
}) => {
  await page.getByRole("button", { name: "View all", exact: true }).click();
  await page.getByLabel("New preset name").fill("My custom room");
  await page.getByRole("button", { name: "Save current as preset" }).click();
  await expect(page.getByLabel("Rename My custom room")).toBeVisible();
  await page.getByLabel("Rename My custom room").fill("Renamed room");
  await page.getByLabel("Rename My custom room").blur();
  await expect(page.getByLabel("Rename Renamed room")).toBeVisible();
  await page
    .getByRole("button", { name: "Duplicate preset Renamed room", exact: true })
    .click();
  await expect(page.getByLabel("Rename Renamed room copy")).toBeVisible();
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export preset Renamed room", exact: true })
    .click();
  const d = await pending;
  expect(d.suggestedFilename()).toBe("cta-preset.json");
  await page
    .getByRole("button", {
      name: "Delete preset Renamed room copy",
      exact: true,
    })
    .click();
  await expect(page.getByLabel("Rename Renamed room copy")).toHaveCount(0);
});
test("Apply saves a real configuration snapshot to the current browser project", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Apply to project", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Design applied");
  const applied = await page.evaluate(async () => {
    return new Promise<boolean>((resolve, reject) => {
      const req = indexedDB.open("cta-designer", 1);
      req.onsuccess = () => {
        const db = req.result;
        const r = db
          .transaction("projects")
          .objectStore("projects")
          .get(localStorage.getItem("cta-active-project")!);
        r.onsuccess = () => {
          resolve(!!r.result.applied);
          db.close();
        };
        r.onerror = () => reject(r.error);
      };
    });
  });
  expect(applied).toBe(true);
});
test("manual assignment maps an image to the selected surface cell", async ({
  page,
}) => {
  const tile = page.locator(".canvas-holder .cta-tile").first();
  await tile.dispatchEvent("click");
  await expect(page.locator(".assignment-hint")).toBeVisible();
  await page
    .getByRole("button", { name: "Assign Solar composition", exact: true })
    .click();
  await expect(tile.locator("img").last()).toHaveAttribute(
    "src",
    "/art/art-4.webp",
  );
});
test("JSON export embeds assets and round trips through project import", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page.getByRole("button", { name: /Project configuration/ }).click();
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export design", exact: true })
    .click();
  const d = await pending;
  const contents = await readFile((await d.path())!, "utf8");
  const p = JSON.parse(contents);
  expect(p.version).toBe(1);
  expect(p.assets[0].src).toMatch(/^data:image\/webp;base64,/);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .getByRole("button", { name: "Open projects", exact: true })
    .click();
  await page.getByLabel("Import project file").setInputFiles({
    name: "project.json",
    mimeType: "application/json",
    buffer: Buffer.from(contents),
  });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".canvas-holder h2")).toContainText("Make room");
});
test("React ZIP contains all working sources and assets", async ({ page }) => {
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export design", exact: true })
    .click();
  const d = await pending;
  const zip = await JSZip.loadAsync(await readFile((await d.path())!));
  expect(Object.keys(zip.files)).toContain("src/runtime/CTASection.tsx");
  expect(Object.keys(zip.files)).toContain("public/fonts/dm-sans.woff2");
  expect(await zip.file("src/project.json")!.async("string")).toContain(
    "data:image/webp;base64,",
  );
  await mkdir("verification-export", { recursive: true });
  for (const [name, file] of Object.entries(zip.files)) {
    if (file.dir)
      await mkdir(`verification-export/${name}`, { recursive: true });
    else {
      const parts = name.split("/");
      parts.pop();
      await mkdir(`verification-export/${parts.join("/")}`, {
        recursive: true,
      });
      await writeFile(
        `verification-export/${name}`,
        await file.async("nodebuffer"),
      );
    }
  }
});
test("standalone HTML uses the actual renderer and works offline", async ({
  page,
  context,
}) => {
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page.getByRole("button", { name: /Standalone HTML/ }).click();
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export design", exact: true })
    .click();
  const d = await pending;
  const html = await readFile((await d.path())!, "utf8");
  expect(html).not.toContain("Designed by");
  const offline = await context.newPage();
  await offline.route("**/*", (route) => route.abort());
  await offline.setContent(html, { waitUntil: "domcontentloaded" });
  await expect(offline.locator(".cta-plane")).toHaveCount(5);
  await expect(offline.locator("h2")).toContainText("Make room");
  expect(await offline.locator(".cta-tile").count()).toBeGreaterThan(15);
  await offline.screenshot({ path: "research/standalone-verified.png" });
  await offline.close();
});
test("PNG export creates a real image", async ({ page }) => {
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page.getByRole("button", { name: /Canvas snapshot/ }).click();
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export design", exact: true })
    .click();
  const d = await pending;
  const b = await readFile((await d.path())!);
  expect(b.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  expect(b.length).toBeGreaterThan(15000);
  await writeFile("research/export-verified.png", b);
});

test("exported HTML visually matches the paused canvas at the same size", async ({
  page,
  context,
}) => {
  await page
    .getByRole("button", { name: "Pause animation", exact: true })
    .click();
  await page.waitForTimeout(400);
  const section = page.locator(".canvas-holder .cta-section");
  const rect = await section.boundingBox();
  const original = await section.screenshot();
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page.getByRole("button", { name: /Standalone HTML/ }).click();
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export design", exact: true })
    .click();
  const downloaded = await pending;
  const html = await readFile((await downloaded.path())!, "utf8");
  const exported = await context.newPage();
  await exported.setViewportSize({
    width: Math.round(rect!.width),
    height: Math.round(rect!.height),
  });
  await exported.setContent(html, { waitUntil: "domcontentloaded" });
  await exported.waitForFunction(
    () =>
      document.fonts.status === "loaded" &&
      [...document.images].every((i) => i.complete && i.naturalWidth > 0),
  );
  await exported.waitForTimeout(150);
  const snapshot = await exported.locator(".cta-section").screenshot();
  const a = await sharp(original)
    .resize(Math.round(rect!.width), Math.round(rect!.height))
    .removeAlpha()
    .raw()
    .toBuffer();
  const b = await sharp(snapshot)
    .resize(Math.round(rect!.width), Math.round(rect!.height))
    .removeAlpha()
    .raw()
    .toBuffer();
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference += Math.abs(a[i] - b[i]);
  expect(difference / a.length / 255).toBeLessThan(0.025);
  await writeFile("research/export-fidelity-preview.png", original);
  await writeFile("research/export-fidelity-html.png", snapshot);
  await exported.close();
});

test("preview enables CTA navigation while editing prevents it", async ({
  page,
  context,
}) => {
  let externalRequests = 0;
  await context.route("https://example.com/**", async (route) => {
    externalRequests++;
    await route.fulfill({
      body: "CTA destination reached",
      contentType: "text/plain",
    });
  });
  await page.locator(".canvas-holder .cta-button").click();
  expect(externalRequests).toBe(0);
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  const popup = page.waitForEvent("popup");
  await page.locator(".canvas-holder .cta-button").click();
  const destination = await popup;
  await destination.waitForLoadState();
  expect(destination.url()).toBe("https://example.com/");
  expect(externalRequests).toBe(1);
  await destination.close();
});

test("projects can be created, renamed, duplicated and deleted", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Open projects", exact: true })
    .click();
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByLabel("Project name", { exact: true })
    .fill("Second exploration");
  await expect(page.getByText("Saved locally", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Open projects", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Duplicate Second exploration", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: /Second exploration copy.*Current project/,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Second exploration copy/ }).first(),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Delete Second exploration copy",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Delete Second exploration copy",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.reload();
  await expect(page.getByLabel("Project name", { exact: true })).toHaveValue(
    "Second exploration",
  );
});
test("keyboard dialog focus and reduced motion remain usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page
    .getByRole("button", { name: "Editor settings", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(
      () => document.activeElement?.closest("dialog") !== null,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Editor settings", exact: true }),
  ).toBeFocused();
  await expect(page.locator(".canvas-holder .cta-section")).toHaveClass(
    /cta-reduced/,
  );
  const transform = await page
    .locator(".canvas-holder .cta-world")
    .evaluate((el) => getComputedStyle(el).transform);
  await page.mouse.move(900, 450);
  await page.waitForTimeout(200);
  expect(
    await page
      .locator(".canvas-holder .cta-world")
      .evaluate((el) => getComputedStyle(el).transform),
  ).toBe(transform);
});
test("desktop accessibility audit", async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
for (const width of [1024, 768, 390, 320])
  test(`responsive layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(300);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator(".canvas-holder")).toBeVisible();
    if (width < 768) {
      await page.getByRole("button", { name: "Controls", exact: true }).click();
      await expect(page.getByLabel("Depth", { exact: true })).toBeVisible();
      await page.getByLabel("Depth", { exact: true }).fill("1800");
      await page
        .getByRole("button", { name: "Close controls", exact: true })
        .click();
      await page.getByRole("button", { name: "Images", exact: true }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
    }
    await page.screenshot({
      path: `research/responsive-${width}.png`,
      fullPage: true,
    });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
