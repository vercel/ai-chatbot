/** biome-ignore-all lint/suspicious/useAwait: <explanation> */
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  unlinkSync,
} from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { generateUUID } from "../utils";

// Configuration
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const MAX_FILE_SIZE = Number.parseInt(
  process.env.MAX_FILE_SIZE || "10485760",
  10
); // 10MB default

// Ensure upload directory exists
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

export type FileUploadResult = {
  url: string;
  pathname: string;
  contentType?: string;
  contentDisposition?: string;
  size: number;
};

export type FileUploadOptions = {
  filename?: string;
  contentType?: string;
  addRandomSuffix?: boolean;
};

/**
 * Upload a file to local storage
 */
export async function upload(
  filename: string,
  blob: Blob | Buffer,
  options: FileUploadOptions = {}
): Promise<FileUploadResult> {
  try {
    const {
      filename: optionsFilename,
      contentType = "application/octet-stream",
      addRandomSuffix = true,
    } = options;

    // Generate filename
    let finalFilename = optionsFilename || filename;
    if (addRandomSuffix) {
      const extension = finalFilename.split(".").pop();
      const baseName = finalFilename.replace(`.${extension}`, "");
      finalFilename = `${baseName}-${generateUUID()}.${extension}`;
    }

    const filePath = join(UPLOAD_DIR, finalFilename);

    // Convert blob to buffer if needed
    let buffer: Buffer;
    if (blob instanceof Buffer) {
      buffer = blob;
    } else {
      const arrayBuffer = await (blob as Blob).arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    // Check file size
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`
      );
    }

    // Write file using a Readable so pipeline receives a stream
    const writeStream = createWriteStream(filePath);
    const readable = Readable.from(buffer);
    await pipeline(readable, writeStream);

    // Return result
    const result: FileUploadResult = {
      url: `/api/files/${finalFilename}`,
      pathname: finalFilename,
      contentType,
      size: buffer.length,
    };

    return result;
  } catch (error) {
    throw new Error(
      `Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Delete a file from local storage
 */
export function del(pathname: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const filePath = join(UPLOAD_DIR, pathname);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
      resolve();
    } catch (error) {
      reject(
        new Error(
          `Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`
        )
      );
    }
  });
}

/**
 * List files in local storage (optional utility)
 */
export async function list(
  options: { prefix?: string; limit?: number } = {}
): Promise<{ blobs: Array<{ pathname: string; size: number }> }> {
  try {
    const fs = await import("node:fs/promises");
    const files = await fs.readdir(UPLOAD_DIR);

    let filteredFiles = files;
    if (options.prefix) {
      const prefix = options.prefix;
      filteredFiles = files.filter((file) => file.startsWith(prefix));
    }

    if (options.limit) {
      filteredFiles = filteredFiles.slice(0, options.limit);
    }

    const blobs = await Promise.all(
      filteredFiles.map(async (file) => {
        const filePath = join(UPLOAD_DIR, file);
        const stats = await fs.stat(filePath);
        return {
          pathname: file,
          size: stats.size,
        };
      })
    );

    return { blobs };
  } catch (error) {
    throw new Error(
      `Failed to list files: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get file stream for serving files
 */
export function getFileStream(pathname: string): ReadableStream<Uint8Array> {
  const filePath = join(UPLOAD_DIR, pathname);

  if (!existsSync(filePath)) {
    throw new Error("File not found");
  }

  const readStream = createReadStream(filePath);

  return new ReadableStream({
    start(controller) {
      readStream.on("data", (chunk) => {
        // Convert chunk to Uint8Array regardless of type
        const uint8Array =
          chunk instanceof Buffer
            ? new Uint8Array(chunk)
            : new Uint8Array(Buffer.from(String(chunk)));
        controller.enqueue(uint8Array);
      });

      readStream.on("end", () => {
        controller.close();
      });

      readStream.on("error", (error) => {
        controller.error(error);
      });
    },
    cancel() {
      readStream.destroy();
    },
  });
}

/**
 * Check if file exists
 */
export function exists(pathname: string): boolean {
  const filePath = join(UPLOAD_DIR, pathname);
  return existsSync(filePath);
}

// Export a compatible API that matches Vercel Blob
export { upload as put };
export default { upload, put: upload, del, list, getFileStream, exists };
