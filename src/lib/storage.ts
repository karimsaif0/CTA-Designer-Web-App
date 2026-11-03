import { openDB } from "idb";
import type { DBSchema } from "idb";
import { parseProject } from "../runtime/config";
import type { Project } from "../runtime/config";
import { presetSchema } from "./presets";
import type { Preset } from "./presets";
interface DesignerDB extends DBSchema {
  projects: { key: string; value: Project };
  presets: { key: string; value: Preset };
}
const db = () =>
  openDB<DesignerDB>("cta-designer", 1, {
    upgrade(d) {
      d.createObjectStore("projects", { keyPath: "id" });
      d.createObjectStore("presets", { keyPath: "id" });
    },
  });
export async function saveProject(project: Project, activate = true) {
  const d = await db();
  await d.put("projects", project);
  if (activate) localStorage.setItem("cta-active-project", project.id);
}
export async function loadProjects() {
  const d = await db();
  const all = await d.getAll("projects");
  return all
    .flatMap((p) => {
      try {
        return [parseProject(p)];
      } catch {
        return [];
      }
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
export async function deleteProject(id: string) {
  const d = await db();
  await d.delete("projects", id);
}
export async function loadPresets() {
  const d = await db();
  return (await d.getAll("presets")).flatMap((p) => {
    const r = presetSchema.safeParse(p);
    return r.success ? [r.data] : [];
  });
}
export async function savePreset(p: Preset) {
  const d = await db();
  await d.put("presets", presetSchema.parse(p));
}
export async function deletePreset(id: string) {
  const d = await db();
  await d.delete("presets", id);
}
