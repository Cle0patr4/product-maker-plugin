import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogSource =
  | 'cli'
  | 'config'
  | 'state'
  | 'init'
  | 'build'
  | 'status'
  | 'watch'
  | 'cancel'
  | 'orchestrator'
  | 'executor'
  | 'tester'
  | 'system';

export interface LogRecord {
  timestamp: string;
  level: LogLevel;
  source: LogSource;
  message: string;
  meta?: Record<string, unknown>;
}

export interface LoggerOptions {
  streamFile?: string;
  console?: boolean;
  level?: LogLevel;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const LEVEL_STYLE: Record<LogLevel, (s: string) => string> = {
  debug: chalk.gray,
  info: chalk.cyan,
  warn: chalk.yellow,
  error: chalk.red,
};

export class Logger {
  private readonly streamFile: string | undefined;
  private readonly emitConsole: boolean;
  private readonly minLevel: number;

  constructor(opts: LoggerOptions = {}) {
    this.streamFile = opts.streamFile;
    this.emitConsole = opts.console ?? true;
    this.minLevel = LEVEL_ORDER[opts.level ?? 'info'];

    if (this.streamFile) {
      mkdirSync(dirname(this.streamFile), { recursive: true });
    }
  }

  debug(source: LogSource, message: string, meta?: Record<string, unknown>): void {
    this.emit('debug', source, message, meta);
  }
  info(source: LogSource, message: string, meta?: Record<string, unknown>): void {
    this.emit('info', source, message, meta);
  }
  warn(source: LogSource, message: string, meta?: Record<string, unknown>): void {
    this.emit('warn', source, message, meta);
  }
  error(source: LogSource, message: string, meta?: Record<string, unknown>): void {
    this.emit('error', source, message, meta);
  }

  private emit(
    level: LogLevel,
    source: LogSource,
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    if (LEVEL_ORDER[level] < this.minLevel) return;

    const record: LogRecord = {
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      ...(meta ? { meta } : {}),
    };

    if (this.streamFile) {
      try {
        appendFileSync(this.streamFile, JSON.stringify(record) + '\n', 'utf8');
      } catch {
        // File sink failures must not crash the CLI; fall through to console.
      }
    }

    if (this.emitConsole) {
      const tag = LEVEL_STYLE[level](`[${level}]`);
      const src = chalk.dim(`[${source}]`);
      const meta_ = meta && Object.keys(meta).length > 0 ? ' ' + chalk.dim(JSON.stringify(meta)) : '';
      process.stderr.write(`${tag} ${src} ${message}${meta_}\n`);
    }
  }
}

export function createConsoleLogger(level: LogLevel = 'info'): Logger {
  return new Logger({ console: true, level });
}
