import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { runInit } from '../src/commands/init.js';
import { runStatus } from '../src/commands/status.js';
import { makeTmpDir, cleanup, silentLogger, captureStdout } from './helpers.js';

describe('runStatus', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTmpDir();
  });

  afterEach(() => {
    cleanup(dir);
  });

  it('reports uninitialized when no state exists', () => {
    const { result, out } = captureStdout(() =>
      runStatus({ cwd: dir, logger: silentLogger() }),
    );
    expect(result.initialized).toBe(false);
    expect(result.state).toBeNull();
    expect(out).toMatch(/No Product Maker project/);
  });

  it('prints project summary after init', () => {
    captureStdout(() =>
      runInit({ cwd: dir, projectName: 'acme', stack: 'next', logger: silentLogger() }),
    );
    const { result, out } = captureStdout(() =>
      runStatus({ cwd: dir, logger: silentLogger() }),
    );
    expect(result.initialized).toBe(true);
    expect(result.state?.project.name).toBe('acme');
    expect(out).toContain('acme');
    expect(out).toContain('initialized');
  });

  it('emits JSON with --json', () => {
    captureStdout(() =>
      runInit({ cwd: dir, projectName: 'acme', stack: 'next', logger: silentLogger() }),
    );
    const { out } = captureStdout(() =>
      runStatus({ cwd: dir, logger: silentLogger(), json: true }),
    );
    const parsed = JSON.parse(out);
    expect(parsed.project.name).toBe('acme');
    expect(parsed.schemaVersion).toBe(1);
  });
});
