import { download } from "../lib/download";
import { useState } from "react";
import {
  ArrowUpRight,
  Braces,
  Code2,
  FileArchive,
  FileImage,
  FileJson,
  Check,
  Download,
} from "lucide-react";
import { Dialog } from "./Dialog";
import { useEditor } from "../lib/store";
import {
  exportReact,
  exportHTML,
  exportPNG,
  portableProject,
} from "../lib/export";
export function ExportDialog({
  onClose,
  getCanvas,
}: {
  onClose: () => void;
  getCanvas: () => HTMLElement | null;
}) {
  const project = useEditor((s) => s.project),
    notify = useEditor((s) => s.notify);
  const [format, setFormat] = useState("project"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const options = [
    {
      id: "project",
      icon: FileArchive,
      label: "Complete React project",
      detail: "Vite + React + TypeScript · ready to run",
      ext: "ZIP",
    },
    {
      id: "component",
      icon: Braces,
      label: "React component",
      detail: "Reusable TSX, styles, configuration & assets",
      ext: "ZIP",
    },
    {
      id: "html",
      icon: Code2,
      label: "Standalone HTML",
      detail: "One self-contained file · same React runtime",
      ext: "HTML",
    },
    {
      id: "json",
      icon: FileJson,
      label: "Project configuration",
      detail: "Full project, embedded images & asset manifest",
      ext: "JSON",
    },
    {
      id: "png",
      icon: FileImage,
      label: "Canvas snapshot",
      detail: "Current composition · 2× resolution",
      ext: "PNG",
    },
  ];
  async function run() {
    setBusy(true);
    setError("");
    try {
      const slug =
        project.name
          .replace(/[^a-z0-9]+/gi, "-")
          .replace(/^-|-$/g, "")
          .toLowerCase() || "cta-design";
      let blob: Blob;
      let ext: string;
      if (format === "project" || format === "component") {
        blob = await exportReact(project, format === "project");
        ext = "zip";
      } else if (format === "html") {
        blob = await exportHTML(project);
        ext = "html";
      } else if (format === "json") {
        blob = new Blob(
          [JSON.stringify(await portableProject(project), null, 2)],
          { type: "application/json" },
        );
        ext = "json";
      } else {
        const el = getCanvas();
        if (!el) throw new Error("Canvas is unavailable.");
        blob = await exportPNG(el);
        ext = "png";
      }
      download(
        blob,
        `${slug}${format === "component" ? "-component" : ""}.${ext}`,
      );
      notify(`${options.find((o) => o.id === format)?.label} exported.`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Export failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog title="Take your design with you" onClose={onClose}>
      <div className="dialog-body">
        <p className="dialog-intro">
          From a little exploration to your next production.
          <br />
          Your design, your code. No strings attached.
        </p>
        <div className="export-options">
          {options.map(({ id, icon: Icon, label, detail, ext }) => (
            <button
              key={id}
              className={`export-option ${format === id ? "selected" : ""}`}
              onClick={() => setFormat(id)}
              aria-pressed={format === id}
            >
              <Icon size={22} />
              <span>
                <strong>{label}</strong>
                <small>{detail}</small>
              </span>
              <span className="format-tag">{ext}</span>
              {format === id && <Check size={16} />}
            </button>
          ))}
        </div>
        <div className="export-note">
          <ArrowUpRight size={15} />
          <span>
            Exports use the actual preview renderer. Uploaded assets are
            included. Editor branding stays in the editor.
          </span>
        </div>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <button
          className="primary full"
          onClick={() => void run()}
          disabled={busy}
        >
          <Download size={16} />
          {busy ? "Packaging your design…" : "Export design"}
        </button>
      </div>
    </Dialog>
  );
}
