import JSZip from "jszip";
import { toPng } from "html-to-image";
import type { Project } from "../runtime/config";
import { parseProject } from "../runtime/config";
import renderer from "../runtime/CTASection.tsx?raw";
import geometry from "../runtime/geometry.ts?raw";
import configSource from "../runtime/config.ts?raw";
import css from "../runtime/cta.css?raw";
export async function portableProject(project: Project): Promise<Project> {
  const copy = parseProject(structuredClone(project));
  copy.assets = await Promise.all(
    copy.assets.map(async (asset) => {
      if (asset.src.startsWith("data:")) return asset;
      const res = await fetch(asset.src);
      if (!res.ok) throw new Error(`Could not package ${asset.name}`);
      const blob = await res.blob();
      const src = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(new Error("Asset read failed"));
        r.readAsDataURL(blob);
      });
      return { ...asset, src };
    }),
  );
  return copy;
}
export const exportPackage = {
  name: "my-interactive-cta",
  private: true,
  version: "1.0.0",
  type: "module",
  scripts: {
    dev: "vite --host 0.0.0.0",
    build: "tsc --noEmit && vite build",
    preview: "vite preview",
  },
  dependencies: { react: "^19.2.0", "react-dom": "^19.2.0", zod: "^4.1.12" },
  devDependencies: {
    vite: "^7.2.0",
    typescript: "~5.9.3",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
  },
};
export function reactFiles(
  project: Project,
  complete = true,
): Record<string, string> {
  return {
    "src/runtime/CTASection.tsx": renderer,
    "src/runtime/geometry.ts": geometry,
    "src/runtime/config.ts": configSource,
    "src/runtime/cta.css": css,
    "src/project.json": JSON.stringify(project, null, 2),
    "src/font.css": `@font-face{font-family:'DM Sans';src:url('/fonts/dm-sans.woff2') format('woff2');font-weight:100 900;font-display:swap}`,
    "src/MyCTA.tsx": `import { CTASection } from './runtime/CTASection';\nimport { parseProject } from './runtime/config';\nimport data from './project.json';\nimport './font.css';\nconst project = parseProject(data);\nexport default function MyCTA() { return <CTASection config={project.config} assets={project.assets} />; }\n`,
    "README.md": `# ${project.name.replace(/[\r\n]/g, " ")}\n\nA portable interactive CTA. The renderer is the same source used in CTA Designer. No editor branding is added.\n\n${complete ? "Run `npm install`, then `npm run dev`. Build with `npm run build`." : "Copy src into your React + TypeScript project. Install react, react-dom and zod. Import MyCTA and place it in a container with a defined height (e.g. 650px)."}\n\nImages are embedded in project.json for offline portability. Typography uses the included DM Sans font (SIL OFL); artwork is original and included under MIT. Motion respects the operating system reduced-motion preference. CTA navigation is enabled.\n`,
    ...(complete
      ? {
          "package.json": JSON.stringify(exportPackage, null, 2),
          "index.html":
            '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Interactive CTA</title></head><body style="margin:0"><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>',
          "src/main.tsx": `import { createRoot } from 'react-dom/client';\nimport MyCTA from './MyCTA';\nimport './styles.css';\ncreateRoot(document.getElementById('root')!).render(<main style={{height:'100svh',minHeight:400}}><MyCTA /></main>);`,
          "src/styles.css": `*{box-sizing:border-box}body{margin:0}`,
          "tsconfig.json": JSON.stringify(
            {
              compilerOptions: {
                target: "ES2022",
                lib: ["ES2022", "DOM", "DOM.Iterable"],
                module: "ESNext",
                moduleResolution: "Bundler",
                jsx: "react-jsx",
                strict: true,
                skipLibCheck: true,
                noEmit: true,
                resolveJsonModule: true,
                esModuleInterop: true,
              },
              include: ["src"],
            },
            null,
            2,
          ),
        }
      : {}),
  };
}
export async function exportReact(project: Project, complete = true) {
  const portable = await portableProject(project);
  const zip = new JSZip();
  for (const [name, contents] of Object.entries(reactFiles(portable, complete)))
    zip.file(name, contents);
  for (const [path, url] of [
    ["public/fonts/dm-sans.woff2", "/fonts/dm-sans.woff2"],
    ["LICENSE", "/LICENSE"],
    ["THIRD_PARTY_NOTICES.md", "/THIRD_PARTY_NOTICES.md"],
    ["public/fonts/OFL.txt", "/fonts/OFL.txt"],
  ]) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Missing export dependency: ${url}`);
    zip.file(path, await r.arrayBuffer());
  }
  return zip.generateAsync({ type: "blob" });
}
export async function exportHTML(project: Project) {
  const [p, js, styles, font, notices, fontLicense] = await Promise.all([
    portableProject(project),
    fetch("/runtime.js").then((r) => r.text()),
    fetch("/runtime.css").then((r) => r.text()),
    fetch("/fonts/dm-sans.woff2")
      .then((r) => r.blob())
      .then(
        (b) =>
          new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(String(r.result));
            r.onerror = reject;
            r.readAsDataURL(b);
          }),
      ),
    fetch("/THIRD_PARTY_NOTICES.md").then((r) => r.text()),
    fetch("/fonts/OFL.txt").then((r) => r.text()),
  ]);
  const json = JSON.stringify(p).replace(/</g, "\\u003c");
  return new Blob(
    [
      `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Interactive CTA</title><style>@font-face{font-family:'DM Sans';src:url('${font}');font-weight:100 900}body{margin:0}#cta-root{height:100svh;min-height:400px}${styles}</style></head><body><main id="cta-root"></main><script>window.__CTA_PROJECT__=${json};</script><script>${js.replace(/<\/script/gi, "<\\/script")}</script><!--${(notices + "\n\n" + fontLicense).replace(/--/g, "—")}--></body></html>`,
    ],
    { type: "text/html" },
  );
}
export async function exportPNG(element: HTMLElement) {
  await document.fonts.ready;
  const url = await toPng(element, {
    pixelRatio: 2,
    cacheBust: false,
    skipAutoScale: false,
  });
  return fetch(url).then((r) => r.blob());
}
