import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Plus,
  Replace,
  Shuffle,
  Trash2,
  Upload,
} from "lucide-react";
import { useEditor } from "../lib/store";
import { readImage } from "../lib/assets";
export function AssetLibrary() {
  const { project, update, addAssets, notify, selectedTile } = useEditor();
  const input = useRef<HTMLInputElement>(null);
  const replace = useRef<HTMLInputElement>(null);
  const [replacing, setReplacing] = useState("");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  async function upload(files: FileList | null, replaceId?: string) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const results = await Promise.allSettled(
        Array.from(files).slice(0, 60).map(readImage),
      );
      const good = results.flatMap((r) =>
        r.status === "fulfilled" ? [r.value] : [],
      );
      if (replaceId && good[0])
        update((p) => {
          p.assets = p.assets.map((a) =>
            a.id === replaceId ? { ...good[0], id: replaceId } : a,
          );
        });
      else addAssets(good);
      const errors = results.flatMap((r) =>
        r.status === "rejected" ? [String(r.reason)] : [],
      );
      notify(
        errors.length
          ? errors.join(" ")
          : `${good.length} image${good.length === 1 ? "" : "s"} added to your library.`,
      );
    } catch (e) {
      notify(String(e));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
      if (replace.current) replace.current.value = "";
    }
  }
  function reorder(index: number, dir: number) {
    update((p) => {
      const next = index + dir;
      if (next < 0 || next >= p.assets.length) return;
      [p.assets[index], p.assets[next]] = [p.assets[next], p.assets[index]];
    });
  }
  return (
    <div className="asset-library">
      <div className="panel-heading">
        <span>
          IMAGE LIBRARY{" "}
          <small>{project.assets.length.toString().padStart(2, "0")}</small>
        </span>
        <button
          className="icon-button"
          title="Add images"
          aria-label="Add images"
          onClick={() => input.current?.click()}
        >
          <Plus size={16} />
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        hidden
        aria-label="Upload images"
        onChange={(e) => void upload(e.target.files)}
      />
      <input
        ref={replace}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        aria-label="Replace image"
        onChange={(e) => void upload(e.target.files, replacing)}
      />
      <button
        className={`upload-zone ${drag ? "dragging" : ""}`}
        disabled={busy}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void upload(e.dataTransfer.files);
        }}
      >
        <Upload size={19} />
        <span>{busy ? "Processing images…" : "Drop your images here"}</span>
        <small>or click to browse · up to 10 MB</small>
      </button>
      {selectedTile ? (
        <div className="assignment-hint">
          <ImagePlus size={15} />
          <span>
            Click an image to assign it to <strong>{selectedTile}</strong>.
          </span>
          <button
            aria-label="Clear tile selection"
            className="text-button"
            onClick={() => useEditor.setState({ selectedTile: "" })}
          >
            Clear
          </button>
        </div>
      ) : (
        <p className="panel-note">
          Your images, in perspective.
          <br />
          Select a tile on the canvas to assign it.
        </p>
      )}
      <div className="asset-grid">
        {project.assets.map((asset, i) => (
          <div className="asset-item" key={asset.id}>
            <button
              className="asset-thumbnail"
              aria-label={selectedTile ? `Assign ${asset.name}` : asset.name}
              title={selectedTile ? `Assign ${asset.name}` : asset.name}
              onClick={() => {
                if (selectedTile)
                  update((p) => {
                    p.config.images.assignments[selectedTile] = asset.id;
                  });
                else
                  notify(
                    "Select an image tile in the room, then choose an image to assign it.",
                  );
              }}
            >
              <img src={asset.src} alt={asset.name} />
              <span>{String(i + 1).padStart(2, "0")}</span>
            </button>
            <div className="asset-actions">
              <button
                aria-label={`Move ${asset.name} earlier`}
                disabled={!i}
                onClick={() => reorder(i, -1)}
              >
                <ArrowLeft size={12} />
              </button>
              <button
                aria-label={`Move ${asset.name} later`}
                disabled={i === project.assets.length - 1}
                onClick={() => reorder(i, 1)}
              >
                <ArrowRight size={12} />
              </button>
              <button
                aria-label={`Replace ${asset.name}`}
                onClick={() => {
                  setReplacing(asset.id);
                  replace.current?.click();
                }}
              >
                <Replace size={12} />
              </button>
              <button
                aria-label={`Remove ${asset.name}`}
                onClick={() =>
                  update((p) => {
                    p.assets = p.assets.filter((a) => a.id !== asset.id);
                    for (const [key, value] of Object.entries(
                      p.config.images.assignments,
                    ))
                      if (value === asset.id)
                        delete p.config.images.assignments[key];
                  })
                }
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {!project.assets.length && (
        <p className="empty-state">
          A clean canvas. Add an image to start building your room.
        </p>
      )}
      <button
        className="secondary full"
        onClick={() =>
          update((p) => {
            p.config.images.seed = (p.config.images.seed % 99998) + 1;
            p.config.images.assignments = {};
          })
        }
      >
        <Shuffle size={14} />
        Shuffle placement
      </button>
      <div className="library-footer">
        <span>PNG, JPG, WEBP</span>
        <span>{project.assets.length}/60 assets</span>
      </div>
    </div>
  );
}
