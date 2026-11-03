import { z } from "zod";

const n = (min: number, max: number) => z.number().finite().min(min).max(max);
const color = z.string().regex(/^#[0-9a-f]{6}$/i);
export const surfaceNames = [
  "left",
  "right",
  "floor",
  "ceiling",
  "rear",
] as const;
export type Surface = (typeof surfaceNames)[number];
export const assetSchema = z.object({
  id: z.string().max(100),
  name: z.string().max(200),
  src: z
    .string()
    .max(8_000_000)
    .refine(
      (s) =>
        /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s) ||
        /^\/art\/art-[0-7]\.webp$/.test(s),
      "Only embedded raster images or bundled artwork are accepted",
    ),
});
export const configSchema = z.object({
  room: z.object({
    width: n(700, 1800),
    height: n(500, 1200),
    depth: n(500, 2600),
    left: z.boolean(),
    right: z.boolean(),
    floor: z.boolean(),
    ceiling: z.boolean(),
    rear: z.boolean(),
  }),
  camera: z.object({
    fov: n(35, 110),
    x: n(-200, 200),
    y: n(-200, 200),
    z: n(-300, 300),
    rotationX: n(-15, 15),
    rotationY: n(-15, 15),
  }),
  perspective: z.object({ strength: n(0.5, 2), x: n(20, 80), y: n(20, 80) }),
  grid: z.object({
    rows: n(2, 12).int(),
    columns: n(2, 16).int(),
    spacing: n(0, 20),
    lineWidth: n(0, 3),
    opacity: n(0, 1),
    color,
  }),
  images: z.object({
    density: n(0, 1),
    count: n(0, 80).int(),
    seed: n(1, 99999).int(),
    randomness: n(0, 1),
    minSpacing: n(0, 2).int(),
    surface: z.enum(["all", ...surfaceNames]),
    fit: z.enum(["cover", "contain"]),
    opacity: n(0, 1),
    scale: n(0.5, 1.5),
    brightness: n(0.2, 2),
    saturation: n(0, 2),
    assignments: z.record(z.string().max(80), z.string().max(100)),
  }),
  motion: z.object({
    speed: n(0.1, 3),
    intensity: n(0, 2),
    drift: n(0, 3),
    transition: n(100, 3000),
    shuffle: n(0, 30),
    easing: z.enum(["ease-out", "ease-in-out", "linear"]),
    reduced: z.boolean(),
    paused: z.boolean(),
  }),
  interaction: z.object({
    parallax: z.boolean(),
    intensity: n(0, 12),
    smoothness: n(0.02, 0.3),
    damping: n(0.2, 1),
    touch: z.boolean(),
  }),
  typography: z.object({
    headline: z.string().max(300),
    subtitle: z.string().max(500),
    eyebrow: z.string().max(80),
    family: z.enum(["sans", "serif", "mono"]),
    weight: n(300, 900).int(),
    size: n(24, 120),
    lineHeight: n(0.8, 1.8),
    tracking: n(-8, 12),
    align: z.enum(["left", "center", "right"]),
    color,
    width: n(200, 950),
    x: n(10, 90),
    y: n(10, 90),
    shadow: z.boolean(),
    overlay: n(0, 0.9),
    responsive: z.boolean(),
  }),
  button: z.object({
    label: z.string().max(80),
    url: z
      .string()
      .max(2048)
      .refine(
        (s) => /^(https?:\/\/|mailto:|tel:|#|\/)(?!\/)/i.test(s),
        "Use https://, mailto:, tel:, # or a relative path",
      ),
    newTab: z.boolean(),
    background: color,
    color,
    size: n(10, 28),
    weight: n(300, 900).int(),
    paddingX: n(8, 64),
    paddingY: n(6, 32),
    radius: n(0, 50),
    borderColor: color,
    borderWidth: n(0, 5),
    hover: z.enum(["lift", "glow", "none"]),
    press: z.boolean(),
    x: n(10, 90),
    y: n(10, 95),
  }),
  appearance: z.object({
    background: color,
    vignette: n(0, 1),
    grain: n(0, 0.2),
    rounded: n(0, 40),
  }),
});
export type Config = z.infer<typeof configSchema>;
export type Asset = z.infer<typeof assetSchema>;
export const projectSchema = z.object({
  version: z.literal(1),
  id: z.string().max(100),
  name: z.string().min(1).max(80),
  updatedAt: z.number().finite(),
  config: configSchema,
  assets: z.array(assetSchema).max(60),
  applied: configSchema.optional(),
});
export type Project = z.infer<typeof projectSchema>;
export const defaultConfig: Config = {
  room: {
    width: 1100,
    height: 800,
    depth: 1600,
    left: true,
    right: true,
    floor: true,
    ceiling: true,
    rear: true,
  },
  camera: { fov: 62, x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0 },
  perspective: { strength: 1, x: 50, y: 50 },
  grid: {
    rows: 5,
    columns: 8,
    spacing: 4,
    lineWidth: 1,
    opacity: 0.22,
    color: "#a5a6a2",
  },
  images: {
    density: 0.34,
    count: 42,
    seed: 412,
    randomness: 1,
    minSpacing: 0,
    surface: "all",
    fit: "cover",
    opacity: 1,
    scale: 1,
    brightness: 0.9,
    saturation: 0.85,
    assignments: {},
  },
  motion: {
    speed: 1,
    intensity: 1,
    drift: 0.2,
    transition: 800,
    shuffle: 7,
    easing: "ease-in-out",
    reduced: false,
    paused: false,
  },
  interaction: {
    parallax: true,
    intensity: 3,
    smoothness: 0.07,
    damping: 0.8,
    touch: false,
  },
  typography: {
    headline: "Make room\nfor your next big idea.",
    subtitle: "A new perspective. A world of possibilities.",
    eyebrow: "A LITTLE PERSPECTIVE CHANGES EVERYTHING",
    family: "sans",
    weight: 500,
    size: 72,
    lineHeight: 1.08,
    tracking: -2.5,
    align: "center",
    color: "#f4f1e9",
    width: 830,
    x: 50,
    y: 45,
    shadow: true,
    overlay: 0.24,
    responsive: true,
  },
  button: {
    label: "Explore the possibilities",
    url: "https://example.com",
    newTab: true,
    background: "#f5f0e7",
    color: "#1b1d1c",
    size: 15,
    weight: 500,
    paddingX: 24,
    paddingY: 15,
    radius: 4,
    borderColor: "#f5f0e7",
    borderWidth: 0,
    hover: "lift",
    press: true,
    x: 50,
    y: 76,
  },
  appearance: {
    background: "#1c2221",
    vignette: 0.5,
    grain: 0.035,
    rounded: 0,
  },
};
export const sampleAssets: Asset[] = [
  "Desert studies",
  "Chrome object",
  "Blue architecture",
  "Botanical form",
  "Solar composition",
  "Folded paper",
  "Still life",
  "Midnight bloom",
].map((name, i) => ({ id: `sample-${i}`, name, src: `/art/art-${i}.webp` }));
export function newProject(name = "Untitled exploration"): Project {
  return {
    version: 1,
    id: crypto.randomUUID(),
    name,
    updatedAt: Date.now(),
    config: structuredClone(defaultConfig),
    assets: structuredClone(sampleAssets),
  };
}
export function parseProject(value: unknown): Project {
  return projectSchema.parse(value);
}
