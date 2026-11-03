import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  defaultConfig,
  newProject,
  parseProject,
  projectSchema,
} from "../runtime/config";
import { placeTiles, seededRandom, surfaceGeometry } from "../runtime/geometry";
import { builtInPresets, presetSchema } from "./presets";
import { useEditor } from "./store";
import { reactFiles } from "./export";
describe("validated configuration", () => {
  it("round trips an entire project and embedded image manifest", () => {
    const p = newProject();
    expect(parseProject(JSON.parse(JSON.stringify(p)))).toEqual(p);
  });
  it.each([
    "javascript:alert(1)",
    "data:text/html,<script/>",
    "//evil.example",
  ])("rejects unsafe navigation: %s", (url) => {
    const p = newProject();
    p.config.button.url = url;
    expect(projectSchema.safeParse(p).success).toBe(false);
  });
  it("rejects incompatible, malformed, oversized and remote asset data", () => {
    const p = newProject();
    expect(projectSchema.safeParse({ ...p, version: 2 }).success).toBe(false);
    expect(
      projectSchema.safeParse({ ...p, config: { room: { width: Infinity } } })
        .success,
    ).toBe(false);
    p.assets[0].src = "https://example.com/remote.jpg";
    expect(projectSchema.safeParse(p).success).toBe(false);
  });
  it("validates every built-in preset", () => {
    for (const p of builtInPresets)
      expect(presetSchema.safeParse(p).success).toBe(true);
    expect(
      new Set(builtInPresets.map((p) => JSON.stringify(p.config))).size,
    ).toBe(7);
  });
});
describe("room geometry and deterministic placement", () => {
  it("repeats a seed exactly and changes placement with another seed", () => {
    const a = seededRandom(12),
      b = seededRandom(12);
    expect(Array.from({ length: 40 }, () => a())).toEqual(
      Array.from({ length: 40 }, () => b()),
    );
    const c = structuredClone(defaultConfig);
    expect(placeTiles(c, 8)).toEqual(placeTiles(c, 8));
    const first = placeTiles(c, 8);
    c.images.seed++;
    expect(placeTiles(c, 8)).not.toEqual(first);
  });
  it("bounds count, density, grid cells and visible surfaces", () => {
    const c = structuredClone(defaultConfig);
    c.room.left = false;
    c.images.count = 7;
    const tiles = placeTiles(c, 8);
    expect(tiles).toHaveLength(7);
    for (const t of tiles) {
      expect(t.surface).not.toBe("left");
      expect(t.row).toBeLessThan(c.grid.rows);
      expect(t.column).toBeLessThan(c.grid.columns);
    }
    c.images.density = 0;
    expect(placeTiles(c, 8)).toHaveLength(0);
    expect(placeTiles(defaultConfig, 0)).toHaveLength(0);
  });
  it("respects minimum spacing and explicit surface selection", () => {
    const c = structuredClone(defaultConfig);
    c.images.minSpacing = 1;
    c.images.surface = "floor";
    for (const t of placeTiles(c, 8)) {
      expect(t.surface).toBe("floor");
      for (const other of placeTiles(c, 8).filter((x) => x.key !== t.key))
        expect(
          Math.abs(other.row - t.row) > 1 ||
            Math.abs(other.column - t.column) > 1,
        ).toBe(true);
    }
  });
  it("builds connected surfaces from the same dimensions", () => {
    const r = defaultConfig.room;
    expect(surfaceGeometry("left", r)).toMatchObject({
      width: r.depth,
      height: r.height,
    });
    expect(surfaceGeometry("floor", r)).toMatchObject({
      width: r.width,
      height: r.depth,
    });
    expect(surfaceGeometry("rear", r).transform).toBe(
      `translateZ(${-r.depth}px)`,
    );
  });
});
describe("editor transactions and export", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useEditor.getState().open(newProject());
  });
  it("undos and redos a design change without mutating the original", () => {
    const old = useEditor.getState().project;
    useEditor.getState().setProperty("room", "depth", 2100);
    expect(useEditor.getState().project.config.room.depth).toBe(2100);
    expect(old.config.room.depth).toBe(1600);
    useEditor.getState().undo();
    expect(useEditor.getState().project.config.room.depth).toBe(1600);
    useEditor.getState().redo();
    expect(useEditor.getState().project.config.room.depth).toBe(2100);
  });
  it("rejects invalid control values and clears redo on a new edit", () => {
    useEditor.getState().setProperty("room", "depth", 99999);
    expect(useEditor.getState().project.config.room.depth).toBe(1600);
    useEditor.getState().setProperty("room", "depth", 1800);
    useEditor.getState().undo();
    useEditor.getState().setProperty("grid", "rows", 6);
    expect(useEditor.getState().future).toHaveLength(0);
  });
  it("exports actual shared renderer source and a buildable package", () => {
    const p = newProject("Export test");
    const files = reactFiles(p);
    expect(files["src/runtime/CTASection.tsx"]).toContain("surfaceGeometry");
    expect(files["src/runtime/CTASection.tsx"]).toContain("onPointerMove");
    expect(files["src/MyCTA.tsx"]).toContain("parseProject");
    expect(JSON.parse(files["src/project.json"])).toEqual(p);
    expect(files["src/MyCTA.tsx"]).not.toContain("karimsif");
    expect(files["package.json"]).toContain("vite");
  });
});
