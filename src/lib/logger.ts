import { appendFile, mkdir } from "fs/promises";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");

type Level = "info" | "warn" | "error";

function currentLogFile(): string {
  const day = new Date().toISOString().slice(0, 10);
  return path.join(LOG_DIR, `app-${day}.log`);
}

async function write(level: Level, message: string, meta?: Record<string, unknown>): Promise<void> {
  const entry = { time: new Date().toISOString(), level, message, ...meta };

  const consoleFn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  consoleFn(`[${level.toUpperCase()}] ${message}`, meta ?? "");

  try {
    await mkdir(LOG_DIR, { recursive: true });
    await appendFile(currentLogFile(), JSON.stringify(entry) + "\n", "utf8");
  } catch {
    // Logging must never crash the app — the console line above already happened.
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => void write("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => void write("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => void write("error", message, meta),
};
