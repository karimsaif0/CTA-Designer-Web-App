import { create } from "zustand";
import { newProject, configSchema } from "../runtime/config";
import type { Project, Config, Asset } from "../runtime/config";
import { saveProject } from "./storage";
type Status = "Loading" | "Saving" | "Saved locally" | "Save failed";
interface EditorState {
  project: Project;
  past: Project[];
  future: Project[];
  ready: boolean;
  status: Status;
  notice: string;
  selectedTile: string;
  update: (edit: (p: Project) => void) => void;
  setProperty: (group: keyof Config, key: string, value: unknown) => void;
  open: (project: Project) => void;
  undo: () => void;
  redo: () => void;
  notify: (message: string) => void;
  save: () => Promise<boolean>;
  addAssets: (assets: Asset[]) => void;
}
let lastEdit = 0;
export const useEditor = create<EditorState>((set, get) => ({
  project: newProject(),
  past: [],
  future: [],
  ready: false,
  status: "Loading",
  notice: "",
  selectedTile: "",
  update(edit) {
    const state = get();
    const next = structuredClone(state.project);
    edit(next);
    next.updatedAt = Date.now();
    const now = Date.now();
    const add = now - lastEdit > 450;
    lastEdit = now;
    set({
      project: next,
      past: add ? [...state.past.slice(-59), state.project] : state.past,
      future: [],
      status: "Saving",
    });
  },
  setProperty(group, key, value) {
    get().update((p) => {
      const next = {
        ...p.config,
        [group]: { ...p.config[group], [key]: value },
      };
      const result = configSchema.safeParse(next);
      if (result.success) p.config = result.data;
    });
  },
  open(project) {
    lastEdit = 0;
    set({
      project,
      past: [],
      future: [],
      ready: true,
      status: "Saving",
      selectedTile: "",
    });
  },
  undo() {
    const s = get(),
      p = s.past.at(-1);
    if (p) {
      lastEdit = 0;
      set({
        project: { ...p, updatedAt: Date.now() },
        past: s.past.slice(0, -1),
        future: [s.project, ...s.future],
        status: "Saving",
      });
    }
  },
  redo() {
    const s = get(),
      p = s.future[0];
    if (p) {
      lastEdit = 0;
      set({
        project: { ...p, updatedAt: Date.now() },
        past: [...s.past, s.project],
        future: s.future.slice(1),
        status: "Saving",
      });
    }
  },
  notify(notice) {
    set({ notice });
  },
  async save() {
    const project = get().project;
    set({ status: "Saving" });
    try {
      await saveProject(project);
      if (get().project === project) set({ status: "Saved locally" });
      return true;
    } catch (e) {
      set({
        status: "Save failed",
        notice: `Could not save: ${e instanceof Error ? e.message : "storage unavailable"}. Export your project to keep a copy.`,
      });
      return false;
    }
  },
  addAssets(assets) {
    const current = get().project.assets;
    let bytes = current.reduce((sum, a) => sum + a.src.length, 0);
    const accepted: Asset[] = [];
    for (const a of assets) {
      if (
        current.length + accepted.length >= 60 ||
        bytes + a.src.length > 50_000_000
      )
        break;
      accepted.push(a);
      bytes += a.src.length;
    }
    get().update((p) => {
      p.assets = [...p.assets, ...accepted];
    });
    if (accepted.length < assets.length)
      get().notify(
        "Library limit reached: 60 images or 50 MB. Remove some images before adding more.",
      );
  },
}));
