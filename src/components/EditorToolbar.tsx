import {
  ArrowDownToLine,
  ChevronDown,
  FolderOpen,
  Play,
  Redo2,
  RotateCcw,
  Settings2,
  Undo2,
} from "lucide-react";
import { useEditor } from "../lib/store";
import { defaultConfig } from "../runtime/config";
import type { DialogName } from "../lib/ui";
export function EditorToolbar({
  preview,
  setPreview,
  setDialog,
}: {
  preview: boolean;
  setPreview: (value: boolean) => void;
  setDialog: (name: DialogName) => void;
}) {
  const { project, status, past, future, update, undo, redo, notify } =
    useEditor();
  return (
    <header className="topbar">
      <a
        className="brand"
        href="#"
        aria-label="CTA Designer home"
        onClick={(e) => {
          e.preventDefault();
          setDialog("projects");
        }}
      >
        <span className="brand-mark">
          <span />
          <span />
          <span />
        </span>
        <span>
          CTA<span className="brand-light">Designer</span>
        </span>
        <span className="beta-tag">STUDIO</span>
      </a>
      <span className="toolbar-divider" />
      <div className="project-picker">
        <button
          className="icon-button"
          aria-label="Open projects"
          title="Open projects"
          onClick={() => setDialog("projects")}
        >
          <FolderOpen size={17} />
        </button>
        <input
          aria-label="Project name"
          maxLength={80}
          value={project.name}
          onChange={(e) => {
            const name = e.target.value;
            update((p) => {
              p.name = name || "Untitled exploration";
            });
          }}
        />
        <button
          className="icon-button"
          aria-label="Recent projects"
          onClick={() => setDialog("projects")}
        >
          <ChevronDown size={13} />
        </button>
      </div>
      <span
        className={`save-status ${status === "Save failed" ? "failed" : ""}`}
      >
        <span />
        {status}
      </span>
      <div className="topbar-actions">
        <div className="history-buttons">
          <button
            className="icon-button"
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
            disabled={!past.length}
            onClick={undo}
          >
            <Undo2 size={17} />
          </button>
          <button
            className="icon-button"
            aria-label="Redo"
            title="Redo (Ctrl+Shift+Z)"
            disabled={!future.length}
            onClick={redo}
          >
            <Redo2 size={17} />
          </button>
          <button
            className="icon-button"
            aria-label="Reset design"
            title="Reset design (can be undone)"
            onClick={() => {
              update((p) => {
                p.config = structuredClone(defaultConfig);
              });
              notify("Design reset. Use Undo to restore your changes.");
            }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
        <span className="toolbar-divider" />
        <button
          className="secondary preview-toggle"
          onClick={() => setPreview(!preview)}
        >
          <Play size={13} />
          {preview ? "Back to editor" : "Preview"}
        </button>
        <button
          className="primary export-top"
          onClick={() => setDialog("export")}
        >
          <ArrowDownToLine size={15} />
          Export
          <ChevronDown size={12} />
        </button>
        <button
          className="icon-button settings-top"
          aria-label="Editor settings"
          onClick={() => setDialog("settings")}
        >
          <Settings2 size={18} />
        </button>
      </div>
    </header>
  );
}
