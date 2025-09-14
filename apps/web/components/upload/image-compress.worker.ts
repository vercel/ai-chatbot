/* eslint-disable no-restricted-globals */

export type CompressReq = {
  file: File;
  maxBytes: number; // e.g., 2_000_000 for 2MB
  maxWidth: number;
  maxHeight: number;
  quality: number; // 0..1
};

export type CompressRes = {
  ok: true;
  file: File;
  originalBytes: number;
  compressedBytes: number;
} | {
  ok: false;
  error: string;
};

async function resizeAndCompress(file: File, maxW: number, maxH: number, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  const ratio = Math.min(1, maxW / width, maxH / height);
  const nw = Math.max(1, Math.round(width * ratio));
  const nh = Math.max(1, Math.round(height * ratio));
  const canvas = new OffscreenCanvas(nw, nh);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no_2d_context');
  ctx.drawImage(bitmap, 0, 0, nw, nh);
  // Prefer WEBP if available
  const type = 'image/webp';
  const blob = await canvas.convertToBlob({ type, quality: Math.max(0, Math.min(1, quality)) });
  return blob;
}

self.onmessage = async (ev: MessageEvent<CompressReq>) => {
  try {
    const { file, maxBytes, maxWidth, maxHeight, quality } = ev.data;
    const originalBytes = file.size;
    if (originalBytes <= maxBytes) {
      // No compression needed
      const res: CompressRes = { ok: true, file, originalBytes, compressedBytes: originalBytes };
      (self as any).postMessage(res);
      return;
    }
    // Iteratively compress down
    let q = quality;
    let blob = await resizeAndCompress(file, maxWidth, maxHeight, q);
    let guard = 0;
    while (blob.size > maxBytes && q > 0.4 && guard < 5) {
      q -= 0.1;
      blob = await resizeAndCompress(file, maxWidth, maxHeight, q);
      guard++;
    }
    // Construct a new File keeping original name
    const ext = blob.type.includes('webp') ? 'webp' : 'jpg';
    const compressed = new File([blob], file.name.replace(/\.[^.]+$/, `.${ext}`), { type: blob.type });
    const res: CompressRes = {
      ok: true,
      file: compressed,
      originalBytes,
      compressedBytes: compressed.size,
    };
    (self as any).postMessage(res);
  } catch (err: any) {
    const res: CompressRes = { ok: false, error: err?.message || String(err) };
    (self as any).postMessage(res);
  }
};

