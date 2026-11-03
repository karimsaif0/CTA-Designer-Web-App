import { lazy, Suspense } from "react";
import type { RefObject } from "react";
import { Settings2 } from "lucide-react";
import { useEditor } from "../lib/store";
import type { DialogName } from "../lib/ui";
import { Dialog } from "./Dialog";
import { AssetLibrary } from "./AssetLibrary";
import { ProjectDialog } from "./ProjectDialog";
import { PresetDialog } from "./PresetDialog";
const ExportDialog = lazy(() =>
  import("./ExportDialog").then((m) => ({ default: m.ExportDialog })),
);
interface Props {
  dialog: DialogName;
  setDialog: (value: DialogName) => void;
  canvasRef: RefObject<HTMLDivElement | null>;
  panel: boolean;
  setPanel: (value: boolean) => void;
  guides: boolean;
  setGuides: (value: boolean) => void;
}
export function EditorDialogs({
  dialog,
  setDialog,
  canvasRef,
  panel,
  setPanel,
  guides,
  setGuides,
}: Props) {
  const { project, update, save, notify } = useEditor();
  return (
    <Suspense
      fallback={
        <div className="toast" role="status">
          Preparing export…
        </div>
      }
    >
      <>
        {" "}
        {dialog === "export" && (
          <ExportDialog
            onClose={() => setDialog(null)}
            getCanvas={() =>
              canvasRef.current?.querySelector(".cta-section") || null
            }
          />
        )}
        {dialog === "projects" && (
          <ProjectDialog onClose={() => setDialog(null)} />
        )}
        {dialog === "assets" && (
          <Dialog title="Your image library" onClose={() => setDialog(null)}>
            <AssetLibrary />
          </Dialog>
        )}
        {dialog === "presets" && (
          <PresetDialog onClose={() => setDialog(null)} />
        )}
        {dialog === "settings" && (
          <Dialog title="Make yourself at home" onClose={() => setDialog(null)}>
            <div className="dialog-body settings-body">
              <label className="setting-row">
                <span>
                  <strong>Reduced motion</strong>
                  <small>
                    Keep the room still. Your OS preference is also respected.
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={project.config.motion.reduced}
                  onChange={(e) =>
                    update((p) => {
                      p.config.motion.reduced = e.target.checked;
                    })
                  }
                />
              </label>
              <label className="setting-row">
                <span>
                  <strong>Image library</strong>
                  <small>Keep your assets beside the canvas.</small>
                </span>
                <input
                  type="checkbox"
                  checked={panel}
                  onChange={(e) => setPanel(e.target.checked)}
                />
              </label>
              <label className="setting-row">
                <span>
                  <strong>Grid guides</strong>
                  <small>A little extra structure while you work.</small>
                </span>
                <input
                  type="checkbox"
                  checked={guides}
                  onChange={(e) => setGuides(e.target.checked)}
                />
              </label>
              <div className="export-note">
                Projects and uploaded images are stored locally in IndexedDB.
                Export a JSON project for a portable backup. No account, AI
                subscription, or server is required.
              </div>
              <button
                className="secondary full"
                onClick={() => {
                  void save().then((ok) => {
                    if (ok) notify("Project saved locally.");
                  });
                }}
              >
                Save project now
              </button>
            </div>
          </Dialog>
        )}
        {dialog === "help" && (
          <Dialog
            title="A little room to experiment"
            onClose={() => setDialog(null)}
          >
            <div className="dialog-body help-body">
              <button
                className="secondary full"
                onClick={() => setDialog("settings")}
              >
                <Settings2 size={15} />
                Editor settings
              </button>
              <p>Start with a preset, shape the room, then make it yours.</p>
              <ol>
                <li>
                  <strong>Build your space.</strong> Open the control groups to
                  adjust every part of the composition.
                </li>
                <li>
                  <strong>Make it personal.</strong> Drop images into the
                  library. Click a room tile, then an image to assign it.
                </li>
                <li>
                  <strong>See it in motion.</strong> Move your pointer over the
                  room. Preview enables the actual CTA link.
                </li>
                <li>
                  <strong>Take it with you.</strong> Apply saves the design to
                  this browser project. Export a real component, runnable
                  project, standalone HTML, JSON or PNG.
                </li>
              </ol>
              <p>
                Browser mode cannot write into an arbitrary website folder. Use
                the exported React project in your website.
              </p>
              <div className="shortcut-list">
                <span>
                  Undo <kbd>Ctrl / ⌘ Z</kbd>
                </span>
                <span>
                  Redo <kbd>Ctrl / ⌘ Shift Z</kbd>
                </span>
                <span>
                  Save <kbd>Ctrl / ⌘ S</kbd>
                </span>
                <span>
                  Play / pause <kbd>Space</kbd>
                </span>
                <span>
                  Exit preview <kbd>Esc</kbd>
                </span>
              </div>
            </div>
          </Dialog>
        )}
      </>
    </Suspense>
  );
}
