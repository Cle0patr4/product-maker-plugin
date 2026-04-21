import { basename } from 'node:path';
import { Command } from 'commander';
import chalk from 'chalk';
import { Logger } from './logger.js';
import { resolveStatePaths } from './state.js';
import { runInit } from './commands/init.js';
import { runStatus } from './commands/status.js';
import { runBuild } from './commands/build.js';
import { runWatch } from './commands/watch.js';
import { runCancel } from './commands/cancel.js';

const PKG_VERSION = '2.0.0-alpha.0';

function makeLogger(cwd: string, verbose: boolean): Logger {
  const paths = resolveStatePaths(cwd);
  return new Logger({
    streamFile: paths.streamLog,
    console: true,
    level: verbose ? 'debug' : 'info',
  });
}

export function buildProgram(): Command {
  const program = new Command();

  program
    .name('product-maker')
    .description('Autonomous multi-agent product builder (v2 engine)')
    .version(PKG_VERSION)
    .option('-C, --cwd <path>', 'working directory', process.cwd())
    .option('-v, --verbose', 'verbose logging (debug level)', false);

  program
    .command('init')
    .description('Scaffold a new Product Maker project in the current directory')
    .option('--name <name>', 'project name (default: directory basename)')
    .option('--stack <stack>', 'stack identifier', 'nextjs-supabase')
    .option('--force', 'overwrite existing files', false)
    .action((cmdOpts: { name?: string; stack: string; force: boolean }) => {
      const { cwd, verbose } = program.opts<{ cwd: string; verbose: boolean }>();
      const projectName = cmdOpts.name ?? basename(cwd);
      const logger = makeLogger(cwd, verbose);
      runInit({
        cwd,
        projectName,
        stack: cmdOpts.stack,
        logger,
        force: cmdOpts.force,
      });
    });

  program
    .command('build')
    .description('Start the autonomous build loop (Phase 2 stub)')
    .option('--visual-qa', 'enable visual QA (Phase 4+)', false)
    .action(async (cmdOpts: { visualQa: boolean }) => {
      const { cwd, verbose } = program.opts<{ cwd: string; verbose: boolean }>();
      const logger = makeLogger(cwd, verbose);
      const result = await runBuild({ cwd, logger, visualQA: cmdOpts.visualQa });
      if (!result.started && result.reason !== 'phase-2-stub') {
        process.exitCode = 1;
      }
    });

  program
    .command('status')
    .description('Show current project status')
    .option('--json', 'emit raw state as JSON', false)
    .action((cmdOpts: { json: boolean }) => {
      const { cwd, verbose } = program.opts<{ cwd: string; verbose: boolean }>();
      const logger = makeLogger(cwd, verbose);
      const result = runStatus({ cwd, logger, json: cmdOpts.json });
      if (!result.initialized) process.exitCode = 1;
    });

  program
    .command('watch')
    .description('Tail the stream log (Phase 2: static tail; live tail in Phase 3)')
    .option('-n, --lines <count>', 'how many lines to show', (v) => parseInt(v, 10), 50)
    .action((cmdOpts: { lines: number }) => {
      const { cwd, verbose } = program.opts<{ cwd: string; verbose: boolean }>();
      const logger = makeLogger(cwd, verbose);
      const result = runWatch({ cwd, logger, lines: cmdOpts.lines });
      if (!result.found) process.exitCode = 1;
    });

  program
    .command('cancel')
    .description('Mark the loop as cancelled')
    .action(() => {
      const { cwd, verbose } = program.opts<{ cwd: string; verbose: boolean }>();
      const logger = makeLogger(cwd, verbose);
      runCancel({ cwd, logger });
    });

  return program;
}

export async function main(argv: string[]): Promise<number> {
  const program = buildProgram();
  try {
    await program.parseAsync(argv);
    const code = process.exitCode;
    return typeof code === 'number' ? code : 0;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(chalk.red('✗ ') + msg + '\n');
    return 1;
  }
}
