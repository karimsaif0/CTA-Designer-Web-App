import {
  Box,
  Camera,
  ChevronDown,
  CircleDashed,
  Grid2X2,
  Image,
  MousePointer2,
  Move3D,
  Palette,
  Sparkles,
  Type,
  MousePointerClick,
  SlidersHorizontal,
  Download,
  Undo2,
  Redo2,
  RotateCcw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { fields, PropertyField } from "./controls";
import type { Config } from "../runtime/config";
import { defaultConfig } from "../runtime/config";
import { useEditor } from "../lib/store";
const groups: {
  key: keyof Config;
  label: string;
  icon: LucideIcon;
  detail: string;
}[] = [
  { key: "room", label: "Room", icon: Box, detail: "Shape your space" },
  {
    key: "camera",
    label: "Camera",
    icon: Camera,
    detail: "Frame the composition",
  },
  {
    key: "perspective",
    label: "Perspective",
    icon: Move3D,
    detail: "A different point of view",
  },
  { key: "grid", label: "Grid", icon: Grid2X2, detail: "Structure & rhythm" },
  {
    key: "images",
    label: "Image tiles",
    icon: Image,
    detail: "Curate the atmosphere",
  },
  {
    key: "motion",
    label: "Motion",
    icon: CircleDashed,
    detail: "Bring it to life",
  },
  {
    key: "interaction",
    label: "Interaction",
    icon: MousePointer2,
    detail: "Respond to your audience",
  },
  {
    key: "typography",
    label: "Typography",
    icon: Type,
    detail: "Make your statement",
  },
  {
    key: "button",
    label: "CTA button",
    icon: MousePointerClick,
    detail: "Turn attention into action",
  },
  {
    key: "appearance",
    label: "Appearance",
    icon: Palette,
    detail: "The finishing touches",
  },
];
export function Inspector({
  onPresets,
  onExport,
}: {
  onPresets: () => void;
  onExport: () => void;
}) {
  const [open, setOpen] = useState<string[]>(["room"]);
  const { undo, redo, past, future, update } = useEditor();
  return (
    <aside className="inspector" aria-label="Design properties">
      <div className="inspector-title">
        <SlidersHorizontal size={16} />
        <span>Design controls</span>
        <span className="small-badge">LIVE</span>
      </div>
      <div className="inspector-mobile-tools">
        <button className="secondary" disabled={!past.length} onClick={undo}>
          <Undo2 size={14} />
          Undo
        </button>
        <button className="secondary" disabled={!future.length} onClick={redo}>
          <Redo2 size={14} />
          Redo
        </button>
        <button
          className="icon-button"
          aria-label="Restore defaults"
          onClick={() =>
            update((p) => {
              p.config = structuredClone(defaultConfig);
            })
          }
        >
          <RotateCcw size={15} />
        </button>
      </div>
      <div className="inspector-scroll">
        {groups.map(({ key, label, icon: Icon, detail }, i) => (
          <section
            className={`control-group ${open.includes(key) ? "is-open" : ""}`}
            key={key}
          >
            <button
              className="group-heading"
              aria-expanded={open.includes(key)}
              aria-controls={`group-${key}`}
              onClick={() =>
                setOpen((o) =>
                  o.includes(key) ? o.filter((g) => g !== key) : [...o, key],
                )
              }
            >
              <Icon size={17} />
              <span>{label}</span>
              <small>{String(i + 1).padStart(2, "0")}</small>
              <ChevronDown size={14} />
            </button>
            {open.includes(key) && (
              <div id={`group-${key}`} className="group-content">
                <p className="group-description">{detail}</p>
                {fields[key].map((f) => (
                  <PropertyField key={f.key} group={key} field={f} />
                ))}
              </div>
            )}
          </section>
        ))}
        <button className="group-heading" onClick={onPresets}>
          <Sparkles size={17} />
          <span>Presets</span>
          <small>11</small>
          <ChevronDown size={14} />
        </button>
        <button className="group-heading" onClick={onExport}>
          <Download size={17} />
          <span>Export</span>
          <small>12</small>
          <ChevronDown size={14} />
        </button>
        <div className="inspector-tip">
          <span>MADE FOR EXPLORATION</span>
          <p>
            Small changes.
            <br />
            Entirely new perspectives.
          </p>
        </div>
      </div>
    </aside>
  );
}
