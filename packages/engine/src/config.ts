import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

export const CONFIG_BASENAMES = [
  'product-maker.config.json',
  'product-maker.config.mjs',
  'product-maker.config.js',
] as const;

export const ConfigSchema = z.object({
  projectName: z.string().min(1),
  stack: z.string().min(1),
  maxIterations: z.number().int().positive().default(100),
  completionPromise: z.string().min(1).nullable().default(null),
  visualQA: z
    .object({
      enabled: z.boolean().default(false),
      everyNIterations: z.number().int().positive().default(5),
    })
    .default({ enabled: false, everyNIterations: 5 }),
  github: z
    .object({
      repository: z.string().nullable().default(null),
      branch: z.string().default('main'),
    })
    .default({ repository: null, branch: 'main' }),
  costCapUsd: z.number().positive().nullable().default(null),
});

export type Config = z.infer<typeof ConfigSchema>;

export interface LoadedConfig {
  config: Config;
  path: string;
}

export class ConfigNotFoundError extends Error {
  constructor(public readonly cwd: string) {
    super(
      `No product-maker config found in ${cwd}. Expected one of: ${CONFIG_BASENAMES.join(', ')}`,
    );
    this.name = 'ConfigNotFoundError';
  }
}

export class ConfigValidationError extends Error {
  constructor(
    public readonly path: string,
    public readonly issues: z.core.$ZodIssue[],
  ) {
    super(
      `Invalid config at ${path}:\n` +
        issues.map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n'),
    );
    this.name = 'ConfigValidationError';
  }
}

function findConfigFile(cwd: string): string | null {
  for (const name of CONFIG_BASENAMES) {
    const candidate = join(cwd, name);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export async function loadConfig(cwd: string): Promise<LoadedConfig> {
  const path = findConfigFile(cwd);
  if (!path) throw new ConfigNotFoundError(cwd);

  let raw: unknown;
  if (path.endsWith('.json')) {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } else {
    const mod = (await import(path)) as { default?: unknown };
    raw = mod.default ?? mod;
  }

  const result = ConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new ConfigValidationError(path, result.error.issues);
  }
  return { config: result.data, path };
}

export function buildDefaultConfigFile(
  projectName: string,
  stack: string,
): string {
  const defaults: Config = ConfigSchema.parse({ projectName, stack });
  return JSON.stringify(defaults, null, 2) + '\n';
}
