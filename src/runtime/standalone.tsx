import { createRoot } from "react-dom/client";
import { CTASection } from "./CTASection";
import { parseProject } from "./config";
declare global {
  interface Window {
    __CTA_PROJECT__: unknown;
  }
}
const project = parseProject(window.__CTA_PROJECT__);
createRoot(document.getElementById("cta-root")!).render(
  <CTASection config={project.config} assets={project.assets} />,
);
