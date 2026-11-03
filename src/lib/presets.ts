import { z } from "zod";
import { configSchema, defaultConfig } from "../runtime/config";
import type { Config } from "../runtime/config";
export const presetSchema = z.object({
  version: z.literal(1),
  id: z.string().max(100),
  name: z.string().min(1).max(80),
  config: configSchema,
});
export type Preset = z.infer<typeof presetSchema>;
function preset(id: string, name: string, edit: (c: Config) => void): Preset {
  const config = structuredClone(defaultConfig);
  edit(config);
  return { version: 1, id, name, config };
}
export const builtInPresets: Preset[] = [
  preset("editorial", "Minimal Editorial", (c) => {
    c.appearance.background = "#e7e3da";
    c.appearance.vignette = 0.08;
    c.typography.color = "#292b27";
    c.typography.family = "serif";
    c.typography.weight = 400;
    c.typography.headline = "A different\npoint of view.";
    c.typography.shadow = false;
    c.typography.tracking = -3;
    c.grid.color = "#62685e";
    c.images.count = 14;
    c.button.background = "#2d322d";
    c.button.color = "#f2efe7";
  }),
  preset("gallery", "Dark Gallery", () => {}),
  preset("colorful", "Colorful Perspective", (c) => {
    c.appearance.background = "#ccd6cc";
    c.appearance.vignette = 0.05;
    c.grid.color = "#667c74";
    c.typography.color = "#213c35";
    c.typography.headline = "Good things\nare taking shape.";
    c.typography.shadow = false;
    c.images.saturation = 1.4;
    c.images.count = 56;
    c.images.seed = 75;
    c.button.background = "#de5c38";
    c.button.color = "#ffffff";
  }),
  preset("cinematic", "Cinematic Room", (c) => {
    c.room.depth = 2400;
    c.camera.fov = 78;
    c.appearance.background = "#13191e";
    c.appearance.vignette = 0.8;
    c.images.brightness = 0.65;
    c.typography.headline = "Beyond\nthe ordinary.";
    c.typography.family = "serif";
    c.typography.size = 105;
    c.typography.weight = 400;
    c.images.seed = 876;
    c.button.radius = 40;
  }),
  preset("mono", "Monochrome Grid", (c) => {
    c.images.saturation = 0;
    c.images.count = 24;
    c.grid.opacity = 0.5;
    c.appearance.background = "#202020";
    c.typography.headline = "Less noise.\nMore possibility.";
    c.typography.family = "mono";
    c.typography.size = 65;
    c.typography.tracking = -4;
    c.button.radius = 0;
    c.images.seed = 218;
  }),
  preset("portfolio", "Portfolio Showcase", (c) => {
    c.appearance.background = "#342b28";
    c.grid.color = "#b9a89b";
    c.images.count = 58;
    c.images.seed = 502;
    c.typography.headline = "Selected work.\nEndless curiosity.";
    c.typography.family = "serif";
    c.typography.weight = 400;
    c.button.label = "View the collection";
    c.button.background = "#e8d4b6";
  }),
  preset("experimental", "Experimental Type", (c) => {
    c.appearance.background = "#444b19";
    c.typography.headline = "WHAT\nCOMES NEXT?";
    c.typography.size = 112;
    c.typography.weight = 900;
    c.typography.tracking = -7;
    c.typography.color = "#edf6aa";
    c.typography.subtitle = "Follow your curiosity into the unknown.";
    c.button.background = "#edf6aa";
    c.images.seed = 1829;
    c.images.count = 28;
    c.camera.rotationY = -4;
  }),
];
