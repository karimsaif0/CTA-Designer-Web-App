import { EditorDialogs } from "./components/EditorDialogs";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  Layers,
  Menu,
  Sparkles,
  X,
} from "lucide-react";
import { useEditor } from "./lib/store";
import { useEditorSession } from "./lib/useEditorSession";
import type { DialogName } from "./lib/ui";
import { EditorToolbar } from "./components/EditorToolbar";
import { CanvasWorkspace } from "./components/CanvasWorkspace";
import { EditorFooter } from "./components/EditorFooter";
import { Inspector } from "./components/Inspector";
import { AssetLibrary } from "./components/AssetLibrary";
import { loadPreferences, savePreferences } from "./lib/preferences";
import { Analytics } from "@vercel/analytics/react";

export default function App() {
  const { project, update, save, notice, notify } = useEditor();
  const [dialog, setDialog] = useState<DialogName>(null);
  const [preferences] = useState(loadPreferences);
  const [viewport, setViewport] = useState(preferences.viewport),
    [zoom, setZoom] = useState(100),
    [guides, setGuides] = useState(preferences.guides),
    [preview, setPreview] = useState(false),
    [panel, setPanel] = useState(preferences.panel),
    [mobileControls, setMobileControls] = useState(false);
  const canvas = useRef<HTMLDivElement>(null);
  useEffect(() => {
    savePreferences({ panel, guides, viewport });
  }, [panel, guides, viewport]);
  useEditorSession(setPreview);
  async function apply() {
    update((p) => {
      p.applied = structuredClone(p.config);
    });
    if (await save())
      notify(
        "Design applied to this project. Export it when you’re ready to use it on your website.",
      );
  }
  return (
    <div
      className={`app ${preview ? "preview-mode" : ""} ${!panel ? "hide-library" : ""} ${mobileControls ? "show-controls" : ""}`}
    >
      <EditorToolbar
        preview={preview}
        setPreview={setPreview}
        setDialog={setDialog}
      />
      <div className="workspace-heading">
        <div>
          <span className="workspace-label">WORKSPACE</span>
          <ChevronRight size={12} />
          <span>Interactive CTA</span>
          <span className="workspace-dot">·</span>
          <span className="workspace-muted">
            A little perspective goes a long way.
          </span>
        </div>
        <button className="text-button" onClick={() => setDialog("help")}>
          <CircleHelp size={14} />
          Quick guide
          <ArrowUpRight size={12} />
        </button>
      </div>
      <div className="editor-layout">
        <Inspector
          onPresets={() => setDialog("presets")}
          onExport={() => setDialog("export")}
        />
        <CanvasWorkspace
          viewport={viewport}
          setViewport={setViewport}
          zoom={zoom}
          setZoom={setZoom}
          guides={guides}
          setGuides={setGuides}
          preview={preview}
          panel={panel}
          setPanel={setPanel}
          setDialog={setDialog}
          canvasRef={canvas}
        />
        <aside className="right-panel" aria-label="Assets and composition">
          <div className="right-panel-tabs">
            <span>
              <Layers size={15} />
              Assets
            </span>
            <span className="small-badge">LOCAL</span>
          </div>
          <AssetLibrary />
          <div className="composition-info">
            <div className="panel-heading">YOUR COMPOSITION</div>
            <div>
              <span>Surfaces</span>
              <strong>
                {
                  Object.values(project.config.room).filter((v) => v === true)
                    .length
                }{" "}
                planes
              </strong>
            </div>
            <div>
              <span>Grid</span>
              <strong>
                {project.config.grid.columns} × {project.config.grid.rows}
              </strong>
            </div>
            <div>
              <span>Motion</span>
              <strong>
                {project.config.motion.reduced
                  ? "Reduced"
                  : project.config.motion.paused
                    ? "Paused"
                    : "Interactive"}
              </strong>
            </div>
            <div className="apply-info">
              <span className="apply-symbol">↗</span>
              <p>
                A design worth putting
                <br />
                out into the world.
              </p>
            </div>
            <button
              className="primary full apply-button"
              onClick={() => void apply()}
            >
              <Check size={15} />
              Apply to project
            </button>
            <p className="apply-note">
              Save these settings to your active project.
            </p>
          </div>
        </aside>
      </div>
      <div className="mobile-actions">
        <button
          className={mobileControls ? "active" : ""}
          onClick={() => setMobileControls(!mobileControls)}
        >
          <Menu size={16} />
          {mobileControls ? "Close controls" : "Controls"}
        </button>
        <button onClick={() => setDialog("assets")}>
          <Layers size={16} />
          Images
        </button>
        <button onClick={() => setDialog("presets")}>
          <Sparkles size={16} />
          Presets
        </button>
        <button onClick={() => setDialog("export")}>
          <ArrowDownToLine size={16} />
          Export
        </button>
      </div>
      <EditorFooter onHelp={() => setDialog("help")} />
      {notice && (
        <div className="toast" role="status">
          <Check size={16} />
          <span>{notice}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => notify("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      <EditorDialogs
        dialog={dialog}
        setDialog={setDialog}
        canvasRef={canvas}
        panel={panel}
        setPanel={setPanel}
        guides={guides}
        setGuides={setGuides}
      />{" "}
      <Analytics />
    </div>
  );
}
