import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { runInit } from '../src/commands/init.js';
import { runBuild } from '../src/commands/build.js';
import {
  makeTmpDir,
  cleanup,
  silentLogger,
  captureStdout,
  captureStdoutAsync,
} from './helpers.js';

describe('runBuild (Phase 2 stub)', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTmpDir();
  });

  afterEach(() => {
    cleanup(dir);
  });

  it('refuses to run without init', async () => {
    const { result, out } = await captureStdoutAsync(() =>
      runBuild({ cwd: dir, logger: silentLogger() }),
    );
    expect(result.started).toBe(false);
    expect(result.reason).toBe('project not initialized');
    expect(out).toMatch(/not initialized/i);
  });

  it('prints stub message when initialized', async () => {
    captureStdout(() =>
      runInit({ cwd: dir, projectName: 'x', stack: 'nextjs-supabase', logger: silentLogger() }),
    );
    const { result, out } = await captureStdoutAsync(() =>
      runBuild({ cwd: dir, logger: silentLogger() }),
    );
    expect(result.started).toBe(false);
    expect(result.reason).toBe('phase-2-stub');
    expect(out).toMatch(/Phase 2 stub/);
    expect(out).toContain('nextjs-supabase');
  });
});
