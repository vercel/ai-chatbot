export type { CompressReq, CompressRes } from './image-compress.worker';

export interface CompressOptions {
  maxBytes?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/** Create a Web Worker for image compression lazily */
function createWorker(): Worker {
  // @ts-expect-error bundler resolves URL
  const worker = new Worker(new URL('./image-compress.worker.ts', import.meta.url), {
    type: 'module',
  });
  return worker;
}

/** Compress image file if it exceeds maxBytes. Returns the same file otherwise. */
export function compressIfNeeded(file: File, opts: CompressOptions = {}): Promise<File> {
  const maxBytes = opts.maxBytes ?? Number(process.env.NEXT_PUBLIC_UPLOAD_MAX_BYTES || 2_000_000);
  const maxWidth = opts.maxWidth ?? 1920;
  const maxHeight = opts.maxHeight ?? 1080;
  const quality = opts.quality ?? 0.8;

  if (!file.type.startsWith('image/')) return Promise.resolve(file);
  if (file.size <= maxBytes) return Promise.resolve(file);

  return new Promise<File>((resolve, reject) => {
    const worker = createWorker();
    worker.onmessage = (ev: MessageEvent<any>) => {
      worker.terminate();
      const res = ev.data as { ok: boolean; file?: File; error?: string };
      if (res.ok && res.file) resolve(res.file);
      else reject(new Error(res.error || 'compression_failed'));
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(e);
    };
    worker.postMessage({ file, maxBytes, maxWidth, maxHeight, quality });
  });
}

