import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { z } from 'zod';

export const STATE_DIR = '.product-maker';
export const STATE_FILE = 'state.json';
export const LOG_DIR = 'logs';
export const STREAM_LOG = 'stream.log';

export const LoopStatusSchema = z.enum([
  'not-initialized',
  'initialized',
  'running',
  'cancelled',
  'completed',
  'failed',
]);
export type LoopStatus = z.infer<typeof LoopStatusSchema>;

export const AgentIdsSchema = z.object({
  orchestrator: z.string().nullable(),
  executor: z.string().nullable(),
  tester: z.string().nullable(),
});
export type AgentIds = z.infer<typeof AgentIdsSchema>;

export const StateSchema = z.object({
  schemaVersion: z.literal(1),
  project: z.object({
    name: z.string().min(1),
    stack: z.string().min(1),
  }),
  completionPromise: z.string().nullable(),
  status: LoopStatusSchema,
  iteration: z.number().int().nonnegative(),
  cancelled: z.boolean(),
  completed: z.boolean(),
  agents: AgentIdsSchema,
  environmentId: z.string().nullable(),
  currentSessionId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastRunAt: z.string().nullable(),
});
export type State = z.infer<typeof StateSchema>;

export interface InitialStateInput {
  projectName: string;
  stack: string;
  completionPromise?: string | null;
}

export function createInitialState(input: InitialStateInput): State {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    project: {
      name: input.projectName,
      stack: input.stack,
    },
    completionPromise: input.completionPromise ?? null,
    status: 'initialized',
    iteration: 0,
    cancelled: false,
    completed: false,
    agents: { orchestrator: null, executor: null, tester: null },
    environmentId: null,
    currentSessionId: null,
    createdAt: now,
    updatedAt: now,
    lastRunAt: null,
  };
}

export interface StatePaths {
  root: string;
  stateDir: string;
  stateFile: string;
  logDir: string;
  streamLog: string;
}

export function resolveStatePaths(cwd: string): StatePaths {
  const stateDir = join(cwd, STATE_DIR);
  return {
    root: cwd,
    stateDir,
    stateFile: join(stateDir, STATE_FILE),
    logDir: join(stateDir, LOG_DIR),
    streamLog: join(stateDir, LOG_DIR, STREAM_LOG),
  };
}

export function readState(stateFile: string): State {
  const raw = readFileSync(stateFile, 'utf8');
  const parsed: unknown = JSON.parse(raw);
  return StateSchema.parse(parsed);
}

export function tryReadState(stateFile: string): State | null {
  if (!existsSync(stateFile)) return null;
  return readState(stateFile);
}

export function writeState(stateFile: string, state: State): void {
  mkdirSync(dirname(stateFile), { recursive: true });
  const updated: State = { ...state, updatedAt: new Date().toISOString() };
  writeFileSync(stateFile, JSON.stringify(updated, null, 2) + '\n', 'utf8');
}

export function mutateState(stateFile: string, mutator: (s: State) => State): State {
  const current = readState(stateFile);
  const next = mutator(current);
  writeState(stateFile, next);
  return next;
}
