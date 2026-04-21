import chalk from 'chalk';
import { loadConfig } from '../config.js';
import { resolveStatePaths, tryReadState } from '../state.js';
import type { Logger } from '../logger.js';

export interface BuildOptions {
  cwd: string;
  logger: Logger;
  visualQA?: boolean;
}

export interface BuildResult {
  started: boolean;
  reason?: string;
}

export async function runBuild(opts: BuildOptions): Promise<BuildResult> {
  const { cwd, logger } = opts;
  const paths = resolveStatePaths(cwd);

  const state = tryReadState(paths.stateFile);
  if (!state) {
    const reason = 'project not initialized';
    logger.error('build', reason, { path: paths.stateFile });
    process.stdout.write(
      chalk.red('✗') +
        ' Project not initialized. Run ' +
        chalk.bold('product-maker init') +
        ' first.\n',
    );
    return { started: false, reason };
  }

  const { config } = await loadConfig(cwd);
  logger.info('build', 'Config loaded', {
    projectName: config.projectName,
    stack: config.stack,
    maxIterations: config.maxIterations,
  });

  process.stdout.write(
    chalk.yellow('⚠') +
      ' Phase 2 stub — no API calls yet.\n' +
      chalk.dim('  project:  ') +
      chalk.bold(config.projectName) +
      '\n' +
      chalk.dim('  stack:    ') +
      config.stack +
      '\n' +
      chalk.dim('  max iter: ') +
      String(config.maxIterations) +
      '\n' +
      chalk.dim('  visualQA: ') +
      String(config.visualQA.enabled) +
      '\n\n' +
      chalk.dim('  Managed Agents integration arrives in Phase 3. See .claude/ROADMAP.md.\n'),
  );

  return { started: false, reason: 'phase-2-stub' };
}
