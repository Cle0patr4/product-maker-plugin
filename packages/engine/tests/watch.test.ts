import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runWatch } from '../src/commands/watch.js';
import { makeTmpDir, cleanup, silentLogger, captureStdout } from './helpers.js';

describe('runWatch', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTmpDir();
  });

  afterEach(() => {
    cleanup(dir);
  });

  it('reports missing log when nothing has run yet', () => {
    const { result } = captureStdout(() =>
      runWatch({ cwd: dir, logger: silentLogger() }),
    );
    expect(result.found).toBe(false);
    expect(result.lines).toEqual([]);
  });

  it('tails the stream log', () => {
    const logDir = join(dir, '.product-maker', 'logs');
    mkdirSync(logDir, { recursive: true });
    const content = Array.from({ length: 10 }, (_, i) => `line-${i}`).join('\n') + '\n';
    writeFileSync(join(logDir, 'stream.log'), content, 'utf8');

    const { result, out } = captureStdout(() =>
      runWatch({ cwd: dir, logger: silentLogger(), lines: 3 }),
    );
    expect(result.found).toBe(true);
    expect(result.lines).toEqual(['line-7', 'line-8', 'line-9']);
    expect(out).toContain('line-9');
  });
});
