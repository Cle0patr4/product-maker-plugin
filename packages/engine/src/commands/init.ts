import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import { buildDefaultConfigFile } from '../config.js';
import { createInitialState, resolveStatePaths, writeState } from '../state.js';
import type { Logger } from '../logger.js';

export interface InitOptions {
  cwd: string;
  projectName: string;
  stack: string;
  logger: Logger;
  force?: boolean;
}

export interface InitResult {
  created: string[];
  skipped: string[];
}

const CLAUDE_MD_TEMPLATE = (projectName: string, stack: string): string => `# ${projectName}

> Product Maker project spec. Edit the sections below, then run \`product-maker build\`.

## What to build

_Describe the product in one paragraph. What does it do? Who uses it?_

## Stack

\`${stack}\`

## Completion promise

The Orchestrator must write this exact string when the product is done. Leave blank to use the default ("DEPLOYED").

<!-- completion-promise: DEPLOYED -->

## Notes

_Anything the Orchestrator should remember across sessions. It will append its own notes below._
`;

export function runInit(opts: InitOptions): InitResult {
  const { cwd, projectName, stack, logger, force = false } = opts;
  const paths = resolveStatePaths(cwd);
  const created: string[] = [];
  const skipped: string[] = [];

  mkdirSync(paths.stateDir, { recursive: true });
  mkdirSync(paths.logDir, { recursive: true });

  const configPath = join(cwd, 'product-maker.config.json');
  if (existsSync(configPath) && !force) {
    skipped.push(configPath);
    logger.info('init', 'Config already exists; skipping', { path: configPath });
  } else {
    writeFileSync(configPath, buildDefaultConfigFile(projectName, stack), 'utf8');
    created.push(configPath);
    logger.info('init', 'Wrote config', { path: configPath });
  }

  const claudeMdPath = join(cwd, 'CLAUDE.md');
  if (existsSync(claudeMdPath) && !force) {
    skipped.push(claudeMdPath);
    logger.info('init', 'CLAUDE.md already exists; skipping', { path: claudeMdPath });
  } else {
    writeFileSync(claudeMdPath, CLAUDE_MD_TEMPLATE(projectName, stack), 'utf8');
    created.push(claudeMdPath);
    logger.info('init', 'Wrote CLAUDE.md', { path: claudeMdPath });
  }

  if (existsSync(paths.stateFile) && !force) {
    skipped.push(paths.stateFile);
    logger.info('init', 'State already exists; skipping', { path: paths.stateFile });
  } else {
    const initial = createInitialState({ projectName, stack });
    writeState(paths.stateFile, initial);
    created.push(paths.stateFile);
    logger.info('init', 'Wrote initial state', { path: paths.stateFile });
  }

  process.stdout.write(
    chalk.green('✓') +
      ` Initialized ${chalk.bold(projectName)} (${chalk.cyan(stack)})\n` +
      (created.length
        ? chalk.dim('  created:\n') + created.map((p) => `    ${p}\n`).join('')
        : '') +
      (skipped.length
        ? chalk.dim('  skipped (already present):\n') + skipped.map((p) => `    ${p}\n`).join('')
        : '') +
      '\n' +
      chalk.dim('Next: edit CLAUDE.md with your product description, then run ') +
      chalk.bold('product-maker build') +
      chalk.dim('.\n'),
  );

  return { created, skipped };
}
