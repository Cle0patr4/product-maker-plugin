import chalk from 'chalk';
import { resolveStatePaths, tryReadState } from '../state.js';
import type { State } from '../state.js';
import type { Logger } from '../logger.js';

export interface StatusOptions {
  cwd: string;
  logger: Logger;
  json?: boolean;
}

export interface StatusResult {
  initialized: boolean;
  state: State | null;
}

const STATUS_COLOR: Record<State['status'], (s: string) => string> = {
  'not-initialized': chalk.gray,
  initialized: chalk.cyan,
  running: chalk.yellow,
  cancelled: chalk.magenta,
  completed: chalk.green,
  failed: chalk.red,
};

export function runStatus(opts: StatusOptions): StatusResult {
  const { cwd, logger, json = false } = opts;
  const paths = resolveStatePaths(cwd);
  const state = tryReadState(paths.stateFile);

  if (!state) {
    logger.warn('status', 'No state found', { path: paths.stateFile });
    if (json) {
      process.stdout.write(JSON.stringify({ initialized: false }, null, 2) + '\n');
    } else {
      process.stdout.write(
        chalk.yellow('✗') +
          ' No Product Maker project in this directory.\n' +
          chalk.dim('  Run ') +
          chalk.bold('product-maker init') +
          chalk.dim(' first.\n'),
      );
    }
    return { initialized: false, state: null };
  }

  if (json) {
    process.stdout.write(JSON.stringify(state, null, 2) + '\n');
    return { initialized: true, state };
  }

  const statusStyled = STATUS_COLOR[state.status](state.status);
  const lines = [
    `${chalk.bold(state.project.name)} ${chalk.dim(`(${state.project.stack})`)}`,
    `  status:      ${statusStyled}`,
    `  iteration:   ${state.iteration}`,
    `  cancelled:   ${state.cancelled ? chalk.magenta('yes') : 'no'}`,
    `  completed:   ${state.completed ? chalk.green('yes') : 'no'}`,
    `  promise:     ${state.completionPromise ?? chalk.dim('(not set)')}`,
    `  session:     ${state.currentSessionId ?? chalk.dim('(none)')}`,
    `  last run:    ${state.lastRunAt ?? chalk.dim('(never)')}`,
    `  updated:     ${state.updatedAt}`,
  ];
  process.stdout.write(lines.join('\n') + '\n');

  return { initialized: true, state };
}
