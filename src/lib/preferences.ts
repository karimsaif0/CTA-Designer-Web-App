export interface Preferences {
  panel: boolean;
  guides: boolean;
  viewport: string;
}
const defaults: Preferences = {
  panel: true,
  guides: false,
  viewport: "desktop",
};
export function loadPreferences(): Preferences {
  try {
    const p = JSON.parse(localStorage.getItem("cta-preferences") || "null");
    return p &&
      typeof p.panel === "boolean" &&
      typeof p.guides === "boolean" &&
      ["desktop", "tablet", "mobile"].includes(p.viewport)
      ? p
      : defaults;
  } catch {
    return defaults;
  }
}
export function savePreferences(preferences: Preferences) {
  try {
    localStorage.setItem("cta-preferences", JSON.stringify(preferences));
  } catch {
    /* Preferences are optional when browser storage is unavailable. */
  }
}
