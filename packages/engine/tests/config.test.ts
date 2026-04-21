import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  loadConfig,
  buildDefaultConfigFile,
  ConfigNotFoundError,
  ConfigValidationError,
  ConfigSchema,
} from '../src/config.js';
import { makeTmpDir, cleanup } from './helpers.js';

describe('config', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTmpDir();
  });

  afterEach(() => {
    cleanup(dir);
  });

  it('throws ConfigNotFoundError when no config is present', async () => {
    await expect(loadConfig(dir)).rejects.toBeInstanceOf(ConfigNotFoundError);
  });

  it('loads valid JSON config and applies defaults', async () => {
    writeFileSync(
      join(dir, 'product-maker.config.json'),
      JSON.stringify({ projectName: 'x', stack: 'next' }),
      'utf8',
    );
    const { config, path } = await loadConfig(dir);
    expect(config.projectName).toBe('x');
    expect(config.stack).toBe('next');
    expect(config.maxIterations).toBe(100);
    expect(config.visualQA.enabled).toBe(false);
    expect(path.endsWith('product-maker.config.json')).toBe(true);
  });

  it('rejects invalid config with ConfigValidationError', async () => {
    writeFileSync(
      join(dir, 'product-maker.config.json'),
      JSON.stringify({ projectName: '', stack: 'next' }),
      'utf8',
    );
    await expect(loadConfig(dir)).rejects.toBeInstanceOf(ConfigValidationError);
  });

  it('buildDefaultConfigFile produces schema-valid JSON', () => {
    const text = buildDefaultConfigFile('demo', 'nextjs-supabase');
    const parsed = ConfigSchema.parse(JSON.parse(text));
    expect(parsed.projectName).toBe('demo');
    expect(parsed.stack).toBe('nextjs-supabase');
  });
});
