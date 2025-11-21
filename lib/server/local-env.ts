import { promises as fs } from "node:fs";
import path from "node:path";

import { parse } from "dotenv";

const ENV_FILE = path.join(process.cwd(), ".env.local");

type EnvUpdates = Record<string, string | undefined>;

export async function readLocalEnv(
  keys: readonly string[]
): Promise<Record<string, string | undefined>> {
  const content = await readEnvFile();
  const parsed = parse(content);
  const result: Record<string, string | undefined> = {};

  for (const key of keys) {
    result[key] = parsed[key] ?? process.env[key];
  }

  return result;
}

export async function upsertLocalEnv(updates: EnvUpdates): Promise<void> {
  if (Object.keys(updates).length === 0) {
    return;
  }

  const content = await readEnvFile();
  const lines = content.length > 0 ? content.split(/\r?\n/) : [];
  const keyIndex = buildKeyIndex(lines);

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      continue;
    }

    const formatted = `${key}=${formatEnvValue(value)}`;
    if (keyIndex.has(key)) {
      const index = keyIndex.get(key)!;
      lines[index] = formatted;
    } else {
      if (lines.length > 0 && lines[lines.length - 1].trim() !== "") {
        lines.push("");
      }
      keyIndex.set(key, lines.length);
      lines.push(formatted);
    }
  }

  const nextContent = lines.join("\n").replace(/\n?$/, "\n");
  await fs.writeFile(ENV_FILE, nextContent, "utf8");
}

async function readEnvFile(): Promise<string> {
  try {
    return await fs.readFile(ENV_FILE, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return "";
    }
    throw error;
  }
}

function buildKeyIndex(lines: string[]): Map<string, number> {
  const index = new Map<string, number>();
  const pattern = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=.*$/;

  lines.forEach((line, i) => {
    const match = line.match(pattern);
    if (match) {
      index.set(match[1], i);
    }
  });

  return index;
}

function formatEnvValue(value: string): string {
  if (/^[A-Za-z0-9_@./:-]+$/.test(value)) {
    return value;
  }

  const escaped = value.replace(/"/g, '\\"');
  return `"${escaped}"`;
}



