// @spicy/product-maker — public entrypoint.
// Phase 2: programmatic access to the CLI building blocks.

export { main, buildProgram } from './cli.js';
export { runInit } from './commands/init.js';
export { runBuild } from './commands/build.js';
export { runStatus } from './commands/status.js';
export { runWatch } from './commands/watch.js';
export { runCancel } from './commands/cancel.js';

export { Logger, createConsoleLogger } from './logger.js';
export type { LogLevel, LogRecord, LogSource, LoggerOptions } from './logger.js';

export {
  loadConfig,
  buildDefaultConfigFile,
  ConfigSchema,
  ConfigNotFoundError,
  ConfigValidationError,
} from './config.js';
export type { Config, LoadedConfig } from './config.js';

export {
  StateSchema,
  LoopStatusSchema,
  AgentIdsSchema,
  createInitialState,
  resolveStatePaths,
  readState,
  tryReadState,
  writeState,
  mutateState,
} from './state.js';
export type { State, LoopStatus, AgentIds, StatePaths, InitialStateInput } from './state.js';
