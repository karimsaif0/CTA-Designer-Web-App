import { ArrowUpRight, Check, Sparkles } from "lucide-react";
import { useEditor } from "../lib/store";
import { builtInPresets } from "../lib/presets";
import { PresetPreview } from "./PresetPreview";
export function PresetDock({ onOpen }: { onOpen: () => void }) {
  const { project, update } = useEditor();
  const activePreset = builtInPresets.find(
    (p) => JSON.stringify(p.config) === JSON.stringify(project.config),
  )?.id;
  return (
    <section className="preset-dock" aria-label="Preset collection">
      <div className="preset-dock-heading">
        <div>
          <Sparkles size={16} />
          <span>A starting point for your next idea</span>
          <small>CURATED PRESETS</small>
        </div>
        <button className="text-button" onClick={() => onOpen()}>
          View all
          <ArrowUpRight size={13} />
        </button>
      </div>
      <div className="preset-strip">
        {builtInPresets.map((p) => (
          <button
            key={p.id}
            className={`preset-card ${activePreset === p.id ? "selected" : ""}`}
            aria-label={`Apply ${p.name} preset`}
            aria-pressed={activePreset === p.id}
            onClick={() => {
              update((d) => {
                d.config = structuredClone(p.config);
              });
            }}
          >
            <div className="preset-image">
              <PresetPreview preset={p} assets={project.assets} />
              {activePreset === p.id && (
                <span className="preset-check">
                  <Check size={10} />
                </span>
              )}
            </div>
            <span>{p.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
