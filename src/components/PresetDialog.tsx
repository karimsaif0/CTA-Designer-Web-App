import { download } from "../lib/download";
import { useEffect, useRef, useState } from "react";
import { Copy, Download, Plus, Trash2, Upload } from "lucide-react";
import { Dialog } from "./Dialog";
import { builtInPresets, presetSchema } from "../lib/presets";
import type { Preset } from "../lib/presets";
import { deletePreset, loadPresets, savePreset } from "../lib/storage";
import { useEditor } from "../lib/store";
import { PresetPreview } from "./PresetPreview";

export function PresetDialog({ onClose }: { onClose: () => void }) {
  const { project, update, notify } = useEditor();
  const [custom, setCustom] = useState<Preset[]>([]),
    [name, setName] = useState("My perspective"),
    [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const refresh = () => loadPresets().then(setCustom);
  useEffect(() => {
    loadPresets()
      .then(setCustom)
      .catch((e) => setError(String(e)));
  }, []);
  async function persist(p: Preset) {
    try {
      await savePreset(p);
      await refresh();
      notify("Preset saved.");
    } catch (e) {
      setError(String(e));
    }
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 500000) throw new Error("Preset exceeds 500 KB.");
      const p = presetSchema.parse(JSON.parse(await file.text()));
      p.id = crypto.randomUUID();
      await persist(p);
    } catch (e) {
      setError(`Could not import preset: ${String(e)}`);
    }
  }
  return (
    <Dialog title="Find your perspective" onClose={onClose} wide>
      <div className="dialog-body">
        <p className="dialog-intro">
          A starting point, never a limitation. Make it your own.
        </p>
        <div className="preset-dialog-grid">
          {[...builtInPresets, ...custom].map((p) => (
            <div className="preset-dialog-card" key={p.id}>
              <button
                className="preset-preview"
                aria-label={`Apply ${p.name}`}
                onClick={() => {
                  update((d) => {
                    d.config = structuredClone(p.config);
                  });
                  notify(`${p.name} applied.`);
                  onClose();
                }}
              >
                <PresetPreview preset={p} assets={project.assets} />
              </button>
              <div className="preset-card-label">
                {custom.some((c) => c.id === p.id) ? (
                  <input
                    aria-label={`Rename ${p.name}`}
                    defaultValue={p.name}
                    onBlur={(e) => {
                      if (e.target.value.trim())
                        void persist({
                          ...p,
                          name: e.target.value.trim().slice(0, 80),
                        });
                    }}
                  />
                ) : (
                  <strong>{p.name}</strong>
                )}
                <div className="button-row">
                  <button
                    className="icon-button"
                    aria-label={`Duplicate preset ${p.name}`}
                    onClick={() =>
                      void persist({
                        ...structuredClone(p),
                        id: crypto.randomUUID(),
                        name: `${p.name.slice(0, 74)} copy`,
                      })
                    }
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Export preset ${p.name}`}
                    onClick={() =>
                      download(
                        new Blob([JSON.stringify(p, null, 2)], {
                          type: "application/json",
                        }),
                        "cta-preset.json",
                      )
                    }
                  >
                    <Download size={14} />
                  </button>
                  {custom.some((c) => c.id === p.id) && (
                    <button
                      className="icon-button"
                      aria-label={`Delete preset ${p.name}`}
                      onClick={() =>
                        void deletePreset(p.id)
                          .then(refresh)
                          .catch((e) => setError(String(e)))
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="save-preset-row">
          <input
            aria-label="New preset name"
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            className="primary"
            disabled={!name.trim()}
            onClick={() =>
              void persist({
                version: 1,
                id: crypto.randomUUID(),
                name: name.trim(),
                config: structuredClone(project.config),
              })
            }
          >
            <Plus size={15} />
            Save current as preset
          </button>
          <button className="secondary" onClick={() => input.current?.click()}>
            <Upload size={15} />
            Import
          </button>
          <input
            ref={input}
            type="file"
            hidden
            accept=".json,application/json"
            onChange={(e) => void importFile(e.target.files?.[0])}
          />
        </div>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}
