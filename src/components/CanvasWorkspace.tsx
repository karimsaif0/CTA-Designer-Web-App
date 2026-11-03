import { useRef } from "react";
import type { RefObject } from "react";
import {
  Command,
  Expand,
  Focus,
  Grid2X2,
  Maximize2,
  Minus,
  Monitor,
  MousePointer2,
  PanelRightClose,
  Pause,
  Play,
  Plus,
  Smartphone,
  Tablet,
} from "lucide-react";
import { useEditor } from "../lib/store";
import { defaultConfig } from "../runtime/config";
import { CTASection } from "../runtime/CTASection";
import { PresetDock } from "./PresetDock";
import type { DialogName } from "../lib/ui";
interface Props {
  viewport: string;
  setViewport: (value: string) => void;
  zoom: number;
  setZoom: (value: number) => void;
  guides: boolean;
  setGuides: (value: boolean) => void;
  preview: boolean;
  panel: boolean;
  setPanel: (value: boolean) => void;
  setDialog: (value: DialogName) => void;
  canvasRef: RefObject<HTMLDivElement | null>;
}
export function CanvasWorkspace({
  viewport,
  setViewport,
  zoom,
  setZoom,
  guides,
  setGuides,
  preview,
  panel,
  setPanel,
  setDialog,
  canvasRef,
}: Props) {
  const { project, update, notify, selectedTile } = useEditor();
  const workspace = useRef<HTMLDivElement>(null);
  const canvasWidth =
    viewport === "mobile" ? 390 : viewport === "tablet" ? 768 : 1200;
  const setCamera = () =>
    update((p) => {
      p.config.camera = structuredClone(defaultConfig.camera);
    });
  return (
    <main className="main-workspace" ref={workspace}>
      <div className="canvas-toolbar">
        <div className="canvas-label">
          <span className="live-dot" />
          LIVE CANVAS
          <span className="canvas-label-extra">
            {" "}
            / {viewport.toUpperCase()}
          </span>
        </div>
        <div
          className="viewport-switch"
          role="group"
          aria-label="Preview viewport"
        >
          {[
            { id: "desktop", icon: Monitor },
            { id: "tablet", icon: Tablet },
            { id: "mobile", icon: Smartphone },
          ].map(({ id, icon: Icon }) => (
            <button
              key={id}
              aria-label={`${id} viewport`}
              title={`${id} viewport`}
              aria-pressed={viewport === id}
              className={viewport === id ? "active" : ""}
              onClick={() => {
                setViewport(id);
                setZoom(100);
              }}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
        <div className="canvas-tools">
          <button
            className={`icon-button ${guides ? "active" : ""}`}
            aria-label="Toggle grid guides"
            aria-pressed={guides}
            title="Grid guides"
            onClick={() => setGuides(!guides)}
          >
            <Grid2X2 size={15} />
          </button>
          <button
            className="icon-button"
            aria-label="Reset camera"
            title="Reset camera"
            onClick={setCamera}
          >
            <Focus size={17} />
          </button>
          <button
            className="icon-button"
            aria-label="Fullscreen canvas"
            title="Fullscreen"
            onClick={() => {
              const promise = document.fullscreenElement
                ? document.exitFullscreen()
                : workspace.current?.requestFullscreen();
              void promise?.catch(() =>
                notify(
                  "Fullscreen is unavailable in this browser. Use Preview instead.",
                ),
              );
            }}
          >
            <Maximize2 size={15} />
          </button>
          <button
            className="icon-button panel-toggle"
            aria-label="Toggle image library"
            aria-pressed={panel}
            onClick={() => {
              if (window.innerWidth <= 1050) setDialog("assets");
              else setPanel(!panel);
            }}
          >
            <PanelRightClose size={16} />
          </button>
        </div>
      </div>
      <div className={`canvas-area viewport-${viewport}`}>
        <div className="artboard-label">
          <span>01 — {project.name}</span>
          <span>
            {canvasWidth} × {Math.round(canvasWidth * 0.65)}
          </span>
        </div>
        <div
          className="canvas-holder"
          style={{
            maxWidth: canvasWidth,
            transform: `scale(${zoom / 100})`,
          }}
          ref={canvasRef}
        >
          <CTASection
            config={project.config}
            assets={project.assets}
            editing={!preview}
            guides={guides}
            selectedTile={selectedTile}
            onTileSelect={(key) => {
              useEditor.setState({ selectedTile: key });
              setPanel(true);
              if (window.innerWidth <= 1050) setDialog("assets");
            }}
          />
        </div>
        <div className="canvas-caption">
          <MousePointer2 size={13} />
          <span>
            {preview
              ? "Explore your design. CTA links are active."
              : "Move your cursor to explore the room"}
          </span>
          <span className="caption-line" />
          <span>Built to make you look twice.</span>
        </div>
        <div className="canvas-floating-controls">
          <div className="zoom-controls">
            <button
              aria-label="Zoom out"
              disabled={zoom <= 50}
              onClick={() => setZoom(Math.max(50, zoom - 10))}
            >
              <Minus size={14} />
            </button>
            <span>{zoom}%</span>
            <button
              aria-label="Zoom in"
              disabled={zoom >= 150}
              onClick={() => setZoom(Math.min(150, zoom + 10))}
            >
              <Plus size={14} />
            </button>
            <span className="toolbar-divider" />
            <button
              aria-label="Fit to viewport"
              title="Fit to viewport"
              onClick={() => setZoom(100)}
            >
              <Expand size={15} />
            </button>
          </div>
          <button
            className="play-control"
            aria-label={
              project.config.motion.paused
                ? "Play animation"
                : "Pause animation"
            }
            onClick={() =>
              update((p) => {
                p.config.motion.paused = !p.config.motion.paused;
              })
            }
          >
            {project.config.motion.paused ? (
              <Play size={13} />
            ) : (
              <Pause size={13} />
            )}
            <span>{project.config.motion.paused ? "Paused" : "Playing"}</span>
            <span className="keyboard-hint">SPACE</span>
          </button>
        </div>
      </div>
      <PresetDock onOpen={() => setDialog("presets")} />
      <div className="workspace-bottom">
        <span>
          <span className="small-status-dot" />
          All changes happen in your browser
        </span>
        <button className="text-button" onClick={() => setDialog("help")}>
          <Command size={12} />
          Keyboard shortcuts
        </button>
      </div>
    </main>
  );
}
