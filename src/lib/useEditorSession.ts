import { useEffect } from "react";
import { useEditor } from "./store";
import { loadProjects } from "./storage";
export function useEditorSession(setPreview: (value: boolean) => void) {
  const { project, ready, open, save, undo, redo, notice, notify, update } =
    useEditor();
  useEffect(() => {
    let alive = true;
    loadProjects()
      .then((projects) => {
        if (!alive) return;
        const active = localStorage.getItem("cta-active-project");
        const p = projects.find((p) => p.id === active) || projects[0];
        if (p) open(p);
        else useEditor.setState({ ready: true, status: "Saving" });
      })
      .catch(() => {
        if (alive) {
          useEditor.setState({ ready: true, status: "Save failed" });
          notify(
            "Browser storage is unavailable. You can still design and export your project.",
          );
        }
      });
    return () => {
      alive = false;
    };
  }, [open, notify]);
  useEffect(() => {
    if (!ready) return;
    const id = setTimeout(() => void save(), 700);
    return () => clearTimeout(id);
  }, [project, ready, save]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => notify(""), 5500);
    return () => clearTimeout(id);
  }, [notice, notify]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      const editable = (e.target as HTMLElement).closest(
        "input,textarea,select,[contenteditable]",
      );
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
      }
      if (editable || document.querySelector("dialog[open]")) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
      if (
        e.code === "Space" &&
        !(e.target as HTMLElement).closest("button,a")
      ) {
        e.preventDefault();
        update((p) => {
          p.config.motion.paused = !p.config.motion.paused;
        });
      }
      if (e.key === "Escape") setPreview(false);
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [save, undo, redo, update, setPreview]);
}
