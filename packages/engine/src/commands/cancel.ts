import chalk from 'chalk';
import { resolveStatePaths, tryReadState, writeState } from '../state.js';
import type { State } from '../state.js';
import type { Logger } from '../logger.js';

export interface CancelOptions {
  cwd: string;
  logger: Logger;
}

export interface CancelResult {
  cancelled: boolean;
  previousStatus: State['status'] | null;
}

export function runCancel(opts: CancelOptions): CancelResult {
  const { cwd, logger } = opts;
  const paths = resolveStatePaths(cwd);

  const state = tryReadState(paths.stateFile);
  if (!state) {
    logger.error('cancel', 'No state to cancel', { path: paths.stateFile });
    process.stdout.write(
      chalk.red('✗') +
        ' Project not initialized — nothing to cancel.\n',
    );
    return { cancelled: false, previousStatus: null };
  }

  if (state.cancelled) {
    logger.info('cancel', 'Already cancelled', { previous: state.status });
    process.stdout.write(
      chalk.dim('ℹ already cancelled at ') + state.updatedAt + '\n',
    );
    return { cancelled: false, previousStatus: state.status };
  }

  const prev = state.status;
  const next: State = { ...state, status: 'cancelled', cancelled: true };
  writeState(paths.stateFile, next);

  logger.info('cancel', 'Marked state as cancelled', { previous: prev });
  process.stdout.write(
    chalk.magenta('✓') +
      ' Cancelled.\n' +
      chalk.dim('  previous status: ') +
      prev +
      '\n' +
      chalk.dim('  (In Phase 3 this will also send user.interrupt to the running session.)\n'),
  );

  return { cancelled: true, previousStatus: prev };
}
