"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import type { Asset, Config } from "./config";
import { surfaceNames } from "./config";
import { placeTiles, surfaceGeometry } from "./geometry";
import "./cta.css";

export interface CTASectionProps {
  config: Config;
  assets: Asset[];
  editing?: boolean;
  guides?: boolean;
  onTileSelect?: (key: string) => void;
  selectedTile?: string;
  thumbnail?: boolean;
}
export const CTASection = memo(function CTASection({
  config: c,
  assets,
  editing = false,
  guides = false,
  onTileSelect,
  selectedTile,
  thumbnail = false,
}: CTASectionProps) {
  const root = useRef<HTMLElement>(null),
    world = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 }),
    current = useRef({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 1000, height: 650 });
  const [tick, setTick] = useState(0),
    [hidden, setHidden] = useState(
      typeof document !== "undefined" && document.hidden,
    );
  const [osReduced, setOsReduced] = useState(
    typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const reduced = c.motion.reduced || osReduced;
  const stopped = c.motion.paused || reduced || hidden || thumbnail;
  const tiles = useMemo(() => placeTiles(c, assets.length), [c, assets.length]);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const fn = () => setHidden(document.hidden),
      mq = matchMedia("(prefers-reduced-motion: reduce)"),
      change = () => setOsReduced(mq.matches);
    document.addEventListener("visibilitychange", fn);
    mq.addEventListener("change", change);
    return () => {
      document.removeEventListener("visibilitychange", fn);
      mq.removeEventListener("change", change);
    };
  }, []);
  useEffect(() => {
    if (stopped || !c.motion.shuffle) return;
    const id = setInterval(
      () => setTick((t) => t + 1),
      (c.motion.shuffle * 1000) / c.motion.speed,
    );
    return () => clearInterval(id);
  }, [stopped, c.motion.shuffle, c.motion.speed]);
  useEffect(() => {
    let id = 0,
      last = 0,
      phase = 0;
    const frame = (time: number) => {
      const dt = Math.min(time - last || 16, 40);
      last = time;
      const a = 1 - Math.pow(1 - c.interaction.smoothness, dt / 16.67);
      const aim =
        stopped || !c.interaction.parallax ? { x: 0, y: 0 } : target.current;
      current.current.x +=
        (aim.x - current.current.x) * a * c.interaction.damping;
      current.current.y +=
        (aim.y - current.current.y) * a * c.interaction.damping;
      if (!stopped) phase += dt * 0.0003 * c.motion.speed;
      const drift = stopped
        ? 0
        : Math.sin(phase) * c.motion.drift * c.motion.intensity;
      const rx =
        c.camera.rotationX -
        current.current.y * c.interaction.intensity * c.motion.intensity;
      const ry =
        c.camera.rotationY +
        current.current.x * c.interaction.intensity * c.motion.intensity +
        drift;
      if (world.current)
        world.current.style.transform = `translate3d(${c.camera.x}px,${c.camera.y}px,${c.camera.z}px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      if (
        !hidden &&
        !thumbnail &&
        (!stopped ||
          Math.abs(current.current.x) + Math.abs(current.current.y) > 0.001)
      )
        id = requestAnimationFrame(frame);
    };
    id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [c.camera, c.interaction, c.motion, stopped, hidden, thumbnail]);
  function move(e: PointerEvent) {
    if (e.pointerType === "touch" && !c.interaction.touch) return;
    const r = e.currentTarget.getBoundingClientRect();
    target.current = {
      x: ((e.clientX - r.left) / r.width) * 2 - 1,
      y: ((e.clientY - r.top) / r.height) * 2 - 1,
    };
  }
  const scale = Math.max(size.width / 1000, size.height / 650);
  const p =
    650 /
    (2 * Math.tan((c.camera.fov * Math.PI) / 360)) /
    c.perspective.strength;
  const text = c.typography,
    b = c.button;
  const vars = {
    "--cta-bg": c.appearance.background,
    "--cta-grid": c.grid.color,
    "--cta-line": `${guides ? Math.max(1, c.grid.lineWidth) : c.grid.lineWidth}px`,
    "--cta-grid-opacity": guides
      ? Math.max(0.4, c.grid.opacity)
      : c.grid.opacity,
    "--cta-duration": `${reduced ? 0 : c.motion.transition / c.motion.speed}ms`,
    "--cta-easing": c.motion.easing,
    "--cta-press": b.press && !reduced ? "0.96" : "1",
  } as CSSProperties;
  return (
    <section
      ref={root}
      className={`cta-section ${thumbnail ? "cta-thumbnail" : ""} ${reduced ? "cta-reduced" : ""}`}
      style={{ ...vars, borderRadius: c.appearance.rounded }}
      inert={thumbnail || undefined}
      aria-hidden={thumbnail || undefined}
      aria-label={thumbnail ? "Design thumbnail" : "Interactive call to action"}
      onPointerMove={move}
      onPointerLeave={() => {
        target.current = { x: 0, y: 0 };
      }}
    >
      <div
        className="cta-viewport"
        style={{
          transform: `translate(-50%,-50%) scale(${scale})`,
          perspective: p,
          perspectiveOrigin: `${c.perspective.x}% ${c.perspective.y}%`,
        }}
      >
        <div ref={world} className="cta-world">
          {surfaceNames
            .filter((s) => c.room[s])
            .map((surface) => {
              const g = surfaceGeometry(surface, c.room);
              return (
                <div
                  key={surface}
                  className="cta-plane"
                  data-surface={surface}
                  style={{
                    width: g.width,
                    height: g.height,
                    marginLeft: -g.width / 2,
                    marginTop: -g.height / 2,
                    transform: g.transform,
                  }}
                >
                  <div
                    className="cta-grid"
                    style={{
                      backgroundSize: `${100 / c.grid.columns}% ${100 / c.grid.rows}%`,
                    }}
                  />
                  {tiles
                    .filter((t) => t.surface === surface)
                    .map((tile) => {
                      const assigned = c.images.assignments[tile.key];
                      const index = assigned
                        ? assets.findIndex((a) => a.id === assigned)
                        : -1;
                      const asset =
                        assets[
                          index >= 0
                            ? index
                            : (tile.assetIndex + tick) % assets.length
                        ];
                      return (
                        <div
                          key={tile.key}
                          className={`cta-tile ${selectedTile === tile.key ? "cta-selected" : ""}`}
                          style={{
                            left: `${(tile.column / c.grid.columns) * 100}%`,
                            top: `${(tile.row / c.grid.rows) * 100}%`,
                            width: `${100 / c.grid.columns}%`,
                            height: `${100 / c.grid.rows}%`,
                            padding: c.grid.spacing,
                          }}
                          onClick={
                            editing
                              ? (e) => {
                                  e.stopPropagation();
                                  onTileSelect?.(tile.key);
                                }
                              : undefined
                          }
                        >
                          <TileImage
                            asset={asset}
                            images={c.images}
                            duration={c.motion.transition / c.motion.speed}
                            reduced={reduced || thumbnail}
                          />
                        </div>
                      );
                    })}
                </div>
              );
            })}
        </div>
      </div>
      <div
        className="cta-shade"
        style={{
          background: `radial-gradient(ellipse at center, ${c.appearance.background}${Math.round(
            text.overlay * 255,
          )
            .toString(16)
            .padStart(
              2,
              "0",
            )} 10%,transparent 65%),radial-gradient(ellipse at center,transparent 25%,rgba(0,0,0,${c.appearance.vignette}) 100%)`,
        }}
      />
      <div
        className="cta-text"
        style={{
          left: `${text.x}%`,
          top: `${text.y}%`,
          width: `${text.width / 10}%`,
          maxWidth: "94%",
          textAlign: text.align,
          color: text.color,
          fontFamily:
            text.family === "serif"
              ? "Georgia, serif"
              : text.family === "mono"
                ? '"Courier New", monospace'
                : '"DM Sans", sans-serif',
          textShadow: text.shadow ? "0 3px 24px #0007" : "none",
        }}
      >
        {text.eyebrow && (
          <div
            className="cta-eyebrow"
            style={{ fontSize: `${Math.max(8, (11 * size.width) / 1000)}px` }}
          >
            {text.eyebrow}
          </div>
        )}
        <h2
          style={{
            fontSize: text.responsive
              ? `${(text.size * size.width) / 1000}px`
              : text.size,
            fontWeight: text.weight,
            lineHeight: text.lineHeight,
            letterSpacing: (text.tracking * size.width) / 1000,
          }}
        >
          {text.headline}
        </h2>
        {text.subtitle && (
          <p style={{ fontSize: Math.max(11, (16 * size.width) / 1000) }}>
            {text.subtitle}
          </p>
        )}
      </div>
      <a
        className={`cta-button cta-hover-${b.hover}`}
        href={b.url}
        target={b.newTab ? "_blank" : undefined}
        rel={b.newTab ? "noopener noreferrer" : undefined}
        onClick={editing ? (e) => e.preventDefault() : undefined}
        style={{
          left: `${b.x}%`,
          top: `${b.y}%`,
          background: b.background,
          color: b.color,
          fontSize: Math.max(10, (b.size * size.width) / 1000),
          fontWeight: b.weight,
          padding: `${b.paddingY * Math.max(0.65, size.width / 1000)}px ${b.paddingX * Math.max(0.65, size.width / 1000)}px`,
          borderRadius: b.radius,
          border: `${b.borderWidth}px solid ${b.borderColor}`,
        }}
      >
        {b.label}
        <span aria-hidden="true">↗</span>
      </a>
      {c.appearance.grain > 0 && (
        <div className="cta-grain" style={{ opacity: c.appearance.grain }} />
      )}
    </section>
  );
});

function TileImage({
  asset,
  images,
  duration,
  reduced,
}: {
  asset: Asset;
  images: Config["images"];
  duration: number;
  reduced: boolean;
}) {
  const [display, setDisplay] = useState({
    current: asset,
    previous: null as Asset | null,
  });
  useEffect(() => {
    setDisplay((d) =>
      d.current.src === asset.src ? d : { current: asset, previous: d.current },
    );
  }, [asset]);
  useEffect(() => {
    if (!display.previous) return;
    const id = setTimeout(
      () => setDisplay((d) => ({ ...d, previous: null })),
      reduced ? 0 : duration,
    );
    return () => clearTimeout(id);
  }, [display.previous, duration, reduced]);
  const style = {
    objectFit: images.fit,
    opacity: images.opacity,
    transform: `scale(${images.scale})`,
    filter: `brightness(${images.brightness}) saturate(${images.saturation})`,
    "--tile-opacity": images.opacity,
  } as CSSProperties;
  return (
    <>
      {display.previous && !reduced && (
        <img
          className="cta-tile-out"
          src={display.previous.src}
          alt=""
          draggable={false}
          style={style}
        />
      )}
      <img
        key={display.current.src}
        className={display.previous && !reduced ? "cta-tile-in" : ""}
        src={display.current.src}
        alt=""
        draggable={false}
        style={style}
      />
    </>
  );
}
