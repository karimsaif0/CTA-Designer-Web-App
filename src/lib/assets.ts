import type { Asset } from "../runtime/config";
export async function readImage(file: File): Promise<Asset> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error(`${file.name}: use PNG, JPEG or WebP.`);
  if (file.size > 10 * 1024 * 1024)
    throw new Error(`${file.name}: maximum file size is 10 MB.`);
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const png =
    bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
  const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp =
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!(
    (file.type === "image/png" && png) ||
    (file.type === "image/jpeg" && jpg) ||
    (file.type === "image/webp" && webp)
  ))
    throw new Error(`${file.name}: image contents do not match its file type.`);
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 64_000_000)
      throw new Error("Image exceeds 64 megapixels.");
    const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    canvas
      .getContext("2d")!
      .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return {
      id: crypto.randomUUID(),
      name: file.name.slice(0, 200),
      src: canvas.toDataURL("image/webp", 0.86),
    };
  } finally {
    bitmap.close();
  }
}
