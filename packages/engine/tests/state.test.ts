import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  createInitialState,
  resolveStatePaths,
  readState,
  tryReadState,
  writeState,
  mutateState,
  StateSchema,
} from '../src/state.js';
import { makeTmpDir, cleanup } from './helpers.js';

describe('state', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTmpDir();
  });

  afterEach(() => {
    cleanup(dir);
  });

  it('createInitialState produces schema-valid output', () => {
    const s = createInitialState({ projectName: 'demo', stack: 'next' });
    expect(() => StateSchema.parse(s)).not.toThrow();
    expect(s.status).toBe('initialized');
    expect(s.iteration).toBe(0);
    expect(s.agents.orchestrator).toBeNull();
  });

  it('round-trips via writeState/readState', () => {
    const paths = resolveStatePaths(dir);
    const original = createInitialState({ projectName: 'demo', stack: 'next' });
    writeState(paths.stateFile, original);
    const restored = readState(paths.stateFile);
    expect(restored.project).toEqual(original.project);
    expect(restored.status).toBe(original.status);
  });

  it('tryReadState returns null when missing', () => {
    const paths = resolveStatePaths(dir);
    expect(tryReadState(paths.stateFile)).toBeNull();
  });

  it('mutateState increments and bumps timestamp monotonically', async () => {
    const paths = resolveStatePaths(dir);
    writeState(paths.stateFile, createInitialState({ projectName: 'x', stack: 's' }));
    const before = JSON.parse(readFileSync(paths.stateFile, 'utf8')).updatedAt;
    await new Promise((r) => setTimeout(r, 25));
    const after = mutateState(paths.stateFile, (s) => ({ ...s, iteration: s.iteration + 1 }));
    expect(after.iteration).toBe(1);
    expect(Date.parse(after.updatedAt)).toBeGreaterThanOrEqual(Date.parse(before));
  });
});
