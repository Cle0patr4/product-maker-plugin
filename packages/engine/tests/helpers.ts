import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Logger } from '../src/logger.js';

export function makeTmpDir(prefix = 'pm-test-'): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

export function cleanup(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

export function silentLogger(): Logger {
  return new Logger({ console: false, level: 'debug' });
}

export function captureStdout<T>(fn: () => T): { result: T; out: string } {
  const chunks: string[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((data: string | Uint8Array): boolean => {
    chunks.push(typeof data === 'string' ? data : data.toString());
    return true;
  }) as typeof process.stdout.write;
  try {
    const result = fn();
    return { result, out: chunks.join('') };
  } finally {
    process.stdout.write = originalWrite;
  }
}

export async function captureStdoutAsync<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; out: string }> {
  const chunks: string[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((data: string | Uint8Array): boolean => {
    chunks.push(typeof data === 'string' ? data : data.toString());
    return true;
  }) as typeof process.stdout.write;
  try {
    const result = await fn();
    return { result, out: chunks.join('') };
  } finally {
    process.stdout.write = originalWrite;
  }
}
