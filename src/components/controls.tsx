import { useEffect, useId, useState } from "react";
import type { Config } from "../runtime/config";
import { useEditor } from "../lib/store";
export interface Field {
  key: string;
  label: string;
  type?: "color" | "text" | "textarea" | "select" | "toggle";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: string[];
  hint?: string;
}
export const fields: Record<keyof Config, Field[]> = {
  room: [
    { key: "width", label: "Width", min: 700, max: 1800, step: 10, unit: "px" },
    {
      key: "height",
      label: "Height",
      min: 500,
      max: 1200,
      step: 10,
      unit: "px",
    },
    { key: "depth", label: "Depth", min: 500, max: 2600, step: 10, unit: "px" },
    ...["left", "right", "floor", "ceiling", "rear"].map((key) => ({
      key,
      label: `${key[0].toUpperCase() + key.slice(1)} ${key === "left" || key === "right" || key === "rear" ? "wall" : ""}`,
      type: "toggle" as const,
    })),
  ],
  camera: [
    { key: "fov", label: "Field of view", min: 35, max: 110, unit: "°" },
    ...["x", "y", "z"].map((key) => ({
      key,
      label: `Position ${key.toUpperCase()}`,
      min: key === "z" ? -300 : -200,
      max: key === "z" ? 300 : 200,
      unit: "px",
    })),
    ...["X", "Y"].map((k) => ({
      key: `rotation${k}`,
      label: `Rotation ${k}`,
      min: -15,
      max: 15,
      step: 0.5,
      unit: "°",
    })),
  ],
  perspective: [
    {
      key: "strength",
      label: "Perspective strength",
      min: 0.5,
      max: 2,
      step: 0.05,
      unit: "×",
    },
    { key: "x", label: "Vanishing point X", min: 20, max: 80, unit: "%" },
    { key: "y", label: "Vanishing point Y", min: 20, max: 80, unit: "%" },
  ],
  grid: [
    { key: "rows", label: "Rows", min: 2, max: 12 },
    { key: "columns", label: "Columns", min: 2, max: 16 },
    { key: "spacing", label: "Tile inset", min: 0, max: 20, unit: "px" },
    {
      key: "lineWidth",
      label: "Line width",
      min: 0,
      max: 3,
      step: 0.25,
      unit: "px",
    },
    { key: "opacity", label: "Line opacity", min: 0, max: 1, step: 0.01 },
    { key: "color", label: "Grid color", type: "color" },
  ],
  images: [
    { key: "density", label: "Tile density", min: 0, max: 1, step: 0.01 },
    { key: "count", label: "Maximum tiles", min: 0, max: 80 },
    { key: "seed", label: "Placement seed", min: 1, max: 99999 },
    { key: "randomness", label: "Randomness", min: 0, max: 1, step: 0.05 },
    {
      key: "minSpacing",
      label: "Minimum spacing",
      min: 0,
      max: 2,
      unit: "cells",
    },
    {
      key: "surface",
      label: "Place on",
      type: "select",
      options: ["all", "left", "right", "floor", "ceiling", "rear"],
    },
    {
      key: "fit",
      label: "Crop mode",
      type: "select",
      options: ["cover", "contain"],
    },
    ...["opacity", "scale", "brightness", "saturation"].map((key) => ({
      key,
      label: key[0].toUpperCase() + key.slice(1),
      min: key === "scale" ? 0.5 : key === "brightness" ? 0.2 : 0,
      max: key === "opacity" ? 1 : key === "scale" ? 1.5 : 2,
      step: 0.05,
    })),
  ],
  motion: [
    { key: "paused", label: "Pause animation", type: "toggle" },
    { key: "reduced", label: "Reduced motion", type: "toggle" },
    {
      key: "speed",
      label: "Global speed",
      min: 0.1,
      max: 3,
      step: 0.1,
      unit: "×",
    },
    { key: "intensity", label: "Motion intensity", min: 0, max: 2, step: 0.1 },
    { key: "drift", label: "Room drift", min: 0, max: 3, step: 0.1, unit: "°" },
    {
      key: "transition",
      label: "Tile transition",
      min: 100,
      max: 3000,
      step: 50,
      unit: "ms",
    },
    {
      key: "shuffle",
      label: "Shuffle interval",
      min: 0,
      max: 30,
      unit: "s",
      hint: "0 keeps images still",
    },
    {
      key: "easing",
      label: "Easing",
      type: "select",
      options: ["ease-out", "ease-in-out", "linear"],
    },
  ],
  interaction: [
    { key: "parallax", label: "Cursor parallax", type: "toggle" },
    {
      key: "intensity",
      label: "Parallax intensity",
      min: 0,
      max: 12,
      step: 0.5,
      unit: "°",
    },
    {
      key: "smoothness",
      label: "Camera easing",
      min: 0.02,
      max: 0.3,
      step: 0.01,
    },
    { key: "damping", label: "Damping", min: 0.2, max: 1, step: 0.05 },
    { key: "touch", label: "Touch parallax", type: "toggle" },
  ],
  typography: [
    { key: "headline", label: "Headline", type: "textarea" },
    { key: "subtitle", label: "Subtitle", type: "text" },
    { key: "eyebrow", label: "Eyebrow", type: "text" },
    {
      key: "family",
      label: "Font family",
      type: "select",
      options: ["sans", "serif", "mono"],
    },
    { key: "weight", label: "Font weight", min: 300, max: 900, step: 100 },
    { key: "size", label: "Font size", min: 24, max: 120, unit: "px" },
    { key: "responsive", label: "Responsive type", type: "toggle" },
    { key: "lineHeight", label: "Line height", min: 0.8, max: 1.8, step: 0.05 },
    {
      key: "tracking",
      label: "Letter spacing",
      min: -8,
      max: 12,
      step: 0.25,
      unit: "px",
    },
    {
      key: "align",
      label: "Alignment",
      type: "select",
      options: ["left", "center", "right"],
    },
    { key: "color", label: "Text color", type: "color" },
    {
      key: "width",
      label: "Text width",
      min: 200,
      max: 950,
      step: 10,
      unit: "px",
    },
    ...["x", "y"].map((key) => ({
      key,
      label: `Position ${key.toUpperCase()}`,
      min: 10,
      max: 90,
      unit: "%",
    })),
    { key: "shadow", label: "Text shadow", type: "toggle" },
    {
      key: "overlay",
      label: "Readability overlay",
      min: 0,
      max: 0.9,
      step: 0.05,
    },
  ],
  button: [
    { key: "label", label: "Button label", type: "text" },
    {
      key: "url",
      label: "Destination URL",
      type: "text",
      hint: "https://, mailto:, tel:, # or relative path",
    },
    { key: "newTab", label: "Open in new tab", type: "toggle" },
    { key: "background", label: "Background", type: "color" },
    { key: "color", label: "Text color", type: "color" },
    { key: "size", label: "Font size", min: 10, max: 28, unit: "px" },
    { key: "weight", label: "Font weight", min: 300, max: 900, step: 100 },
    {
      key: "paddingX",
      label: "Horizontal padding",
      min: 8,
      max: 64,
      unit: "px",
    },
    { key: "paddingY", label: "Vertical padding", min: 6, max: 32, unit: "px" },
    { key: "radius", label: "Corner radius", min: 0, max: 50, unit: "px" },
    { key: "borderColor", label: "Border color", type: "color" },
    { key: "borderWidth", label: "Border width", min: 0, max: 5, unit: "px" },
    {
      key: "hover",
      label: "Hover effect",
      type: "select",
      options: ["lift", "glow", "none"],
    },
    { key: "press", label: "Press effect", type: "toggle" },
    ...["x", "y"].map((key) => ({
      key,
      label: `Position ${key.toUpperCase()}`,
      min: 10,
      max: key === "y" ? 95 : 90,
      unit: "%",
    })),
  ],
  appearance: [
    { key: "background", label: "Background color", type: "color" },
    { key: "vignette", label: "Vignette", min: 0, max: 1, step: 0.05 },
    { key: "grain", label: "Film grain", min: 0, max: 0.2, step: 0.005 },
    { key: "rounded", label: "Canvas radius", min: 0, max: 40, unit: "px" },
  ],
};
function UrlField({
  id,
  value,
  onSave,
}: {
  id: string;
  value: string;
  onSave: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const valid = /^(https?:\/\/|mailto:|tel:|#|\/)(?!\/)/i.test(draft);
  return (
    <>
      <input
        id={id}
        type="text"
        value={draft}
        aria-invalid={!valid}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (valid) onSave(draft);
        }}
      />
      {!valid && (
        <small className="error-text">Enter a safe destination URL.</small>
      )}
    </>
  );
}
export function PropertyField({
  group,
  field: f,
}: {
  group: keyof Config;
  field: Field;
}) {
  const id = useId();
  const value = useEditor((s) => s.project.config[group])[f.key as never] as
    string | number | boolean;
  const update = useEditor((s) => s.setProperty);
  const set = (v: unknown) => update(group, f.key, v);
  if (f.type === "toggle")
    return (
      <label className="property toggle-row" htmlFor={id}>
        <span>{f.label}</span>
        <input
          id={id}
          type="checkbox"
          checked={!!value}
          onChange={(e) => set(e.target.checked)}
        />
        <span className="switch" />
      </label>
    );
  return (
    <div className={`property property-${f.type || "range"}`}>
      <div className="property-label">
        <label htmlFor={id}>{f.label}</label>
        {!f.type && (
          <span className="numeric-value">
            {String(Number(Number(value).toFixed(3)))} <small>{f.unit}</small>
          </span>
        )}
      </div>
      {f.type === "color" ? (
        <div className="color-input">
          <input
            id={id}
            type="color"
            value={String(value)}
            onChange={(e) => set(e.target.value)}
          />
          <span>{String(value).toUpperCase()}</span>
        </div>
      ) : f.type === "select" ? (
        <select
          id={id}
          value={String(value)}
          onChange={(e) => set(e.target.value)}
        >
          {f.options?.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : f.type === "textarea" ? (
        <textarea
          id={id}
          rows={3}
          value={String(value)}
          onChange={(e) => set(e.target.value)}
        />
      ) : f.type === "text" ? (
        f.key === "url" ? (
          <UrlField id={id} value={String(value)} onSave={set} />
        ) : (
          <input
            id={id}
            type="text"
            value={String(value)}
            maxLength={f.key === "subtitle" ? 500 : 80}
            onChange={(e) => set(e.target.value)}
          />
        )
      ) : (
        <input
          id={id}
          type="range"
          min={f.min}
          max={f.max}
          step={f.step || 1}
          value={Number(value)}
          onChange={(e) => set(Number(e.target.value))}
          style={
            {
              "--range-progress": `${((Number(value) - (f.min || 0)) / ((f.max || 1) - (f.min || 0))) * 100}%`,
            } as React.CSSProperties
          }
        />
      )}
      {f.hint && <small className="field-hint">{f.hint}</small>}
    </div>
  );
}
