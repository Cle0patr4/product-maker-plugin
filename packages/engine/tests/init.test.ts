import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInit } from '../src/commands/init.js';
import { StateSchema } from '../src/state.js';
import { ConfigSchema } from '../src/config.js';
import { makeTmpDir, cleanup, silentLogger, captureStdout } from './helpers.js';

describe('runInit', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTmpDir();
  });

  afterEach(() => {
    cleanup(dir);
  });

  it('creates config, CLAUDE.md and state in a fresh directory', () => {
    const { result } = captureStdout(() =>
      runInit({
        cwd: dir,
        projectName: 'demo',
        stack: 'nextjs-supabase',
        logger: silentLogger(),
      }),
    );

    expect(result.created).toHaveLength(3);
    expect(result.skipped).toHaveLength(0);

    const configRaw = JSON.parse(readFileSync(join(dir, 'product-maker.config.json'), 'utf8'));
    const config = ConfigSchema.parse(configRaw);
    expect(config.projectName).toBe('demo');
    expect(config.stack).toBe('nextjs-supabase');
    expect(config.maxIterations).toBe(100);

    const stateRaw = JSON.parse(readFileSync(join(dir, '.product-maker', 'state.json'), 'utf8'));
    const state = StateSchema.parse(stateRaw);
    expect(state.project.name).toBe('demo');
    expect(state.status).toBe('initialized');
    expect(state.iteration).toBe(0);

    const claudeMd = readFileSync(join(dir, 'CLAUDE.md'), 'utf8');
    expect(claudeMd).toContain('# demo');
    expect(claudeMd).toContain('nextjs-supabase');

    expect(existsSync(join(dir, '.product-maker', 'logs'))).toBe(true);
  });

  it('skips existing files without --force', () => {
    captureStdout(() =>
      runInit({ cwd: dir, projectName: 'one', stack: 's', logger: silentLogger() }),
    );
    const { result } = captureStdout(() =>
      runInit({ cwd: dir, projectName: 'two', stack: 's', logger: silentLogger() }),
    );
    expect(result.created).toHaveLength(0);
    expect(result.skipped).toHaveLength(3);

    const state = JSON.parse(readFileSync(join(dir, '.product-maker', 'state.json'), 'utf8'));
    expect(state.project.name).toBe('one');
  });

  it('overwrites with --force', () => {
    captureStdout(() =>
      runInit({ cwd: dir, projectName: 'one', stack: 's', logger: silentLogger() }),
    );
    const { result } = captureStdout(() =>
      runInit({
        cwd: dir,
        projectName: 'two',
        stack: 'custom',
        logger: silentLogger(),
        force: true,
      }),
    );
    expect(result.created).toHaveLength(3);

    const state = JSON.parse(readFileSync(join(dir, '.product-maker', 'state.json'), 'utf8'));
    expect(state.project.name).toBe('two');
    expect(state.project.stack).toBe('custom');
  });
});
