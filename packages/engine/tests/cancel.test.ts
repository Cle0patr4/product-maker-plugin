import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInit } from '../src/commands/init.js';
import { runCancel } from '../src/commands/cancel.js';
import { makeTmpDir, cleanup, silentLogger, captureStdout } from './helpers.js';

describe('runCancel', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTmpDir();
  });

  afterEach(() => {
    cleanup(dir);
  });

  it('returns cancelled=false when no project is initialized', () => {
    const { result } = captureStdout(() => runCancel({ cwd: dir, logger: silentLogger() }));
    expect(result.cancelled).toBe(false);
    expect(result.previousStatus).toBeNull();
  });

  it('flips state to cancelled when initialized', () => {
    captureStdout(() =>
      runInit({ cwd: dir, projectName: 'x', stack: 's', logger: silentLogger() }),
    );
    const { result } = captureStdout(() =>
      runCancel({ cwd: dir, logger: silentLogger() }),
    );
    expect(result.cancelled).toBe(true);
    expect(result.previousStatus).toBe('initialized');

    const state = JSON.parse(readFileSync(join(dir, '.product-maker', 'state.json'), 'utf8'));
    expect(state.status).toBe('cancelled');
    expect(state.cancelled).toBe(true);
  });

  it('is idempotent — second cancel is a no-op', () => {
    captureStdout(() =>
      runInit({ cwd: dir, projectName: 'x', stack: 's', logger: silentLogger() }),
    );
    captureStdout(() => runCancel({ cwd: dir, logger: silentLogger() }));
    const { result } = captureStdout(() =>
      runCancel({ cwd: dir, logger: silentLogger() }),
    );
    expect(result.cancelled).toBe(false);
    expect(result.previousStatus).toBe('cancelled');
  });
});
