import sharp from "sharp";
import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { build } from "esbuild";
await mkdir("public/art", { recursive: true });
const pieces = [
  [
    "#c4c3b4",
    `<circle cx="320" cy="150" r="64" fill="#f7e8c3"/><path d="M-40 390Q170 100 510 330L510 510H-40" fill="#b6562e"/><path d="M-20 470Q200 210 500 450V510H-20" fill="#e77d3a"/><path d="M100 510Q240 290 530 420V510" fill="#883b25"/>`,
  ],
  [
    "#b7c6b3",
    `<defs><radialGradient id="g" cx="30%" cy="25%"><stop stop-color="#fff"/><stop offset=".22" stop-color="#a6b6a7"/><stop offset=".4" stop-color="#eaf0d8"/><stop offset=".55" stop-color="#455c53"/><stop offset=".72" stop-color="#d4e6d1"/><stop offset="1" stop-color="#172b29"/></radialGradient></defs><ellipse cx="260" cy="398" rx="150" ry="25" fill="#254733" opacity=".22"/><circle cx="250" cy="240" r="155" fill="url(#g)"/>`,
  ],
  [
    "#94b4b3",
    `<path d="M80 500V100H400V500" fill="#36566c"/><path d="M145 500V175Q240 45 335 175V500" fill="#acc7cc"/><path d="M175 500V200Q240 105 305 200V500" fill="#264758"/><path d="M205 500V225Q240 165 275 225V500" fill="#6d9ba5"/><path d="M400 100L500 0V500H400" fill="#173e53"/><path d="M0 500L80 390H400L500 500" fill="#bdc7b8"/>`,
  ],
  [
    "#d5d8bb",
    `<path d="M250 510Q190 250 280 30" stroke="#345d38" stroke-width="9" fill="none"/>${Array.from({ length: 7 }, (_, i) => `<ellipse cx="${i % 2 ? 295 : 190}" cy="${80 + i * 55}" rx="90" ry="28" fill="${i % 2 ? "#516b34" : "#2e4e34"}" transform="rotate(${i % 2 ? -35 : 35} ${i % 2 ? 295 : 190} ${80 + i * 55})"/>`).join("")}`,
  ],
  [
    "#e78632",
    `<circle cx="250" cy="250" r="180" fill="#f5bc56"/><circle cx="250" cy="250" r="135" fill="#ac3d26"/><circle cx="250" cy="250" r="85" fill="#f3a835"/><path d="M0 310L500 200V500H0" fill="#152f36"/><path d="M0 410L500 300V350L0 460" fill="#e4b17c"/>`,
  ],
  [
    "#c9c0d1",
    `<path d="M60 320L300 50 430 370 230 460" fill="#eee8df"/><path d="M60 320L300 50 230 460" fill="#9c6b55"/><path d="M60 320L230 240 230 460" fill="#d89a7d"/><path d="M230 240L300 50 430 370" fill="#f5d6b3"/>`,
  ],
  [
    "#c5a386",
    `<ellipse cx="270" cy="420" rx="150" ry="30" fill="#684f39" opacity=".25"/><path d="M150 205Q150 160 210 160H290Q350 160 350 205V330Q350 410 250 410Q150 410 150 330" fill="#3e5346"/><ellipse cx="250" cy="180" rx="100" ry="35" fill="#6f7f60"/><path d="M210 160V60H285V160" fill="#92734d"/><circle cx="350" cy="100" r="55" fill="#e3ac4c"/>`,
  ],
  [
    "#202d33",
    `${Array.from({ length: 12 }, (_, i) => `<ellipse cx="250" cy="250" rx="155" ry="45" fill="${i % 2 ? "#e0956d" : "#d4ba9b"}" opacity=".86" transform="rotate(${i * 30} 250 250)"/>`).join("")}<circle cx="250" cy="250" r="44" fill="#544b37"/>`,
  ],
];
for (let i = 0; i < pieces.length; i++) {
  const [bg, art] = pieces[i];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><rect width="500" height="500" fill="${bg}"/>${art}<filter id="noise"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="3" stitchTiles="stitch"/></filter><rect width="500" height="500" filter="url(#noise)" opacity=".055"/></svg>`;
  await sharp(Buffer.from(svg))
    .resize(600, 600)
    .webp({ quality: 88 })
    .toFile(`public/art/art-${i}.webp`);
}
await mkdir("public/fonts", { recursive: true });
// Self-hosted Latin variable font, SIL Open Font License, from Google Fonts.
const fontURL =
  "https://fonts.gstatic.com/s/dmsans/v17/rP2Hp2ywxg089UriCZ2IHSeH.woff2";
try {
  await access("public/fonts/dm-sans.woff2");
} catch {
  const r = await fetch(fontURL);
  if (!r.ok) throw new Error("Required font could not be downloaded.");
  await writeFile(
    "public/fonts/dm-sans.woff2",
    Buffer.from(await r.arrayBuffer()),
  );
}
await copyFile("LICENSE", "public/LICENSE");
let notices = await readFile("THIRD_PARTY_NOTICES.md", "utf8");
for (const name of [
  "react",
  "react-dom",
  "zustand",
  "zod",
  "idb",
  "jszip",
  "html-to-image",
  "lucide-react",
]) {
  for (const filename of [
    "LICENSE",
    "LICENSE.md",
    "LICENSE.txt",
    "LICENSE.markdown",
  ]) {
    try {
      const license = await readFile(
        `node_modules/${name}/${filename}`,
        "utf8",
      );
      notices += `\n\n## ${name}\n\n${license}`;
      break;
    } catch {
      /* Try the next conventional license filename. */
    }
  }
}
await writeFile("public/THIRD_PARTY_NOTICES.md", notices);
await build({
  entryPoints: ["src/runtime/standalone.tsx"],
  bundle: true,
  minify: true,
  format: "iife",
  outfile: "public/runtime.js",
  define: { "process.env.NODE_ENV": '"production"' },
  target: ["es2022"],
});
