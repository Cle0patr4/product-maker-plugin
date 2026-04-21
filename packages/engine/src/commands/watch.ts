import { existsSync, readFileSync } from 'node:fs';
import chalk from 'chalk';
import { resolveStatePaths } from '../state.js';
import type { Logger } from '../logger.js';

export interface WatchOptions {
  cwd: string;
  logger: Logger;
  lines?: number;
}

export interface WatchResult {
  found: boolean;
  lines: string[];
}

export function runWatch(opts: WatchOptions): WatchResult {
  const { cwd, logger, lines = 50 } = opts;
  const paths = resolveStatePaths(cwd);

  if (!existsSync(paths.streamLog)) {
    logger.warn('watch', 'No log file yet', { path: paths.streamLog });
    process.stdout.write(
      chalk.yellow('✗') +
        ` No log file at ${paths.streamLog}.\n` +
        chalk.dim('  Run ') +
        chalk.bold('product-maker build') +
        chalk.dim(' first.\n'),
    );
    return { found: false, lines: [] };
  }

  const raw = readFileSync(paths.streamLog, 'utf8');
  const all = raw.split('\n').filter((l) => l.length > 0);
  const tail = all.slice(-lines);

  for (const line of tail) {
    process.stdout.write(line + '\n');
  }

  process.stdout.write(
    chalk.dim(`\n  (showed last ${tail.length} of ${all.length} lines. Live tail arrives in Phase 3.)\n`),
  );

  return { found: true, lines: tail };
}
