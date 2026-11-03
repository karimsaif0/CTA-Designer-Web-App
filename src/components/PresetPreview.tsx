import type { Asset } from "../runtime/config";
import type { Preset } from "../lib/presets";
import { builtInPresets } from "../lib/presets";
import { CTASection } from "../runtime/CTASection";

export function PresetPreview({
  preset,
  assets,
}: {
  preset: Preset;
  assets: Asset[];
}) {
  if (builtInPresets.some((p) => p.id === preset.id))
    return (
      <img
        className="preset-capture"
        src={`/presets/${preset.id}.webp`}
        alt=""
        draggable={false}
      />
    );
  return <CTASection config={preset.config} assets={assets} thumbnail />;
}
