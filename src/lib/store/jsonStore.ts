import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const writeLocks = new Map<string, Promise<unknown>>();

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function filePath(name: string) {
  return path.join(DATA_DIR, `${name}.json`);
}

export async function readCollection<T>(name: string): Promise<T[]> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(filePath(name), "utf-8");
    return JSON.parse(raw) as T[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      await fs.writeFile(filePath(name), "[]");
      return [];
    }
    throw err;
  }
}

// Serializes writes per collection so concurrent requests never interleave
// and corrupt the JSON file.
export async function writeCollection<T>(name: string, data: T[]): Promise<void> {
  await ensureDataDir();
  const previous = writeLocks.get(name) ?? Promise.resolve();
  const next = previous.then(() => fs.writeFile(filePath(name), JSON.stringify(data, null, 2)));
  writeLocks.set(name, next);
  await next;
}
