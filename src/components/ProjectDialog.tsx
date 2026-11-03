import { useEffect, useRef, useState } from "react";
import { Copy, FolderOpen, Plus, Trash2, Upload } from "lucide-react";
import { Dialog } from "./Dialog";
import { deleteProject, loadProjects, saveProject } from "../lib/storage";
import { useEditor } from "../lib/store";
import { newProject, parseProject } from "../runtime/config";
import type { Project } from "../runtime/config";
export function ProjectDialog({ onClose }: { onClose: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]),
    [error, setError] = useState(""),
    [deleting, setDeleting] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const { project, open, save, notify } = useEditor();
  useEffect(() => {
    loadProjects()
      .then(setProjects)
      .catch((e) => setError(String(e)));
  }, []);
  async function change(p: Project) {
    if (!(await save())) {
      setError("Save failed. Export the current project before switching.");
      return;
    }
    open(p);
    onClose();
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 100 * 1024 * 1024)
        throw new Error("Project exceeds 100 MB.");
      const p = parseProject(JSON.parse(await file.text()));
      p.id = crypto.randomUUID();
      await change(p);
      notify("Project imported.");
    } catch (e) {
      setError(
        `Could not import project: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
  return (
    <Dialog title="Your explorations" onClose={onClose}>
      <div className="dialog-body">
        <p className="dialog-intro">
          Saved in this browser, ready whenever inspiration strikes.
        </p>
        <label className="rename-project-label">
          Current project name
          <input
            type="text"
            aria-label="Rename current project"
            maxLength={80}
            value={project.name}
            onChange={(e) =>
              useEditor.getState().update((p) => {
                p.name = e.target.value || "Untitled exploration";
              })
            }
          />
        </label>
        <div className="button-row">
          <button
            className="secondary"
            onClick={() => void change(newProject())}
          >
            <Plus size={15} />
            New project
          </button>
          <button className="secondary" onClick={() => input.current?.click()}>
            <Upload size={15} />
            Import project
          </button>
        </div>
        <input
          ref={input}
          hidden
          type="file"
          accept=".json,application/json"
          aria-label="Import project file"
          onChange={(e) => void importFile(e.target.files?.[0])}
        />
        <div className="project-list">
          {projects.map((p) => (
            <div className="project-row" key={p.id}>
              <button
                onClick={() => void change(p.id === project.id ? project : p)}
                className="project-open"
              >
                <FolderOpen size={19} />
                <span>
                  <strong>{p.id === project.id ? project.name : p.name}</strong>
                  <small>
                    {new Date(p.updatedAt).toLocaleString()}{" "}
                    {p.id === project.id ? "· Current project" : ""}
                  </small>
                </span>
              </button>
              <button
                className="icon-button"
                aria-label={`Duplicate ${p.name}`}
                onClick={() => {
                  const source = p.id === project.id ? project : p;
                  const copy = {
                    ...structuredClone(source),
                    id: crypto.randomUUID(),
                    name: `${source.name.slice(0, 70)} copy`,
                    updatedAt: Date.now(),
                  };
                  void saveProject(copy, false)
                    .then(() => loadProjects())
                    .then(setProjects)
                    .catch((e) => setError(String(e)));
                }}
              >
                <Copy size={15} />
              </button>
              <button
                className="icon-button"
                aria-label={`Delete ${p.name}`}
                onClick={() => setDeleting(p.id)}
              >
                <Trash2 size={15} />
              </button>
              {deleting === p.id && (
                <div className="delete-confirm">
                  <span>Delete this saved project?</span>
                  <button
                    className="danger"
                    onClick={() => {
                      void deleteProject(p.id)
                        .then(() => {
                          if (p.id === project.id) open(newProject());
                          return loadProjects();
                        })
                        .then(setProjects)
                        .catch((e) => setError(String(e)));
                      setDeleting("");
                    }}
                  >
                    Delete
                  </button>
                  <button className="secondary" onClick={() => setDeleting("")}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        {!projects.length && (
          <p className="empty-state">Your next idea starts here.</p>
        )}
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}
