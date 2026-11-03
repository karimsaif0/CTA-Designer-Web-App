import type { Config, Surface } from "./config";
import { surfaceNames } from "./config";
export function seededRandom(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function surfaceGeometry(
  surface: Surface,
  { width: w, height: h, depth: d }: Config["room"],
) {
  switch (surface) {
    case "left":
      return {
        width: d,
        height: h,
        transform: `translate3d(${-w / 2}px,0,${-d / 2}px) rotateY(90deg)`,
      };
    case "right":
      return {
        width: d,
        height: h,
        transform: `translate3d(${w / 2}px,0,${-d / 2}px) rotateY(-90deg)`,
      };
    case "ceiling":
      return {
        width: w,
        height: d,
        transform: `translate3d(0,${-h / 2}px,${-d / 2}px) rotateX(-90deg)`,
      };
    case "floor":
      return {
        width: w,
        height: d,
        transform: `translate3d(0,${h / 2}px,${-d / 2}px) rotateX(90deg)`,
      };
    case "rear":
      return { width: w, height: h, transform: `translateZ(${-d}px)` };
  }
}
export interface Tile {
  key: string;
  surface: Surface;
  row: number;
  column: number;
  assetIndex: number;
}
export function placeTiles(config: Config, assetCount: number): Tile[] {
  if (!assetCount) return [];
  const random = seededRandom(config.images.seed);
  const candidates: (Tile & { rank: number })[] = [];
  for (const surface of surfaceNames) {
    if (
      !config.room[surface] ||
      (config.images.surface === "all" && surface === "rear") ||
      (config.images.surface !== "all" && config.images.surface !== surface)
    )
      continue;
    for (let row = 0; row < config.grid.rows; row++)
      for (let column = 0; column < config.grid.columns; column++) {
        const key = `${surface}-${row}-${column}`;
        if (random() < config.images.density)
          candidates.push({
            key,
            surface,
            row,
            column,
            assetIndex: Math.floor(random() * assetCount),
            rank:
              random() * config.images.randomness +
              ((row * config.grid.columns + column) / 1000) *
                (1 - config.images.randomness),
          });
      }
  }
  candidates.sort((a, b) => a.rank - b.rank);
  const tiles: Tile[] = [];
  for (const tile of candidates) {
    if (tiles.length >= config.images.count) break;
    if (
      config.images.minSpacing &&
      tiles.some(
        (t) =>
          t.surface === tile.surface &&
          Math.abs(t.row - tile.row) <= config.images.minSpacing &&
          Math.abs(t.column - tile.column) <= config.images.minSpacing,
      )
    )
      continue;
    tiles.push(tile);
  }
  return tiles;
}
