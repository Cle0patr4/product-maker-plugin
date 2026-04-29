# Product Maker — Onboarding for Claude

This file is the first thing any future Claude session should read when working in this repo. It's written for Claude, not humans — humans have `README.md`.

> ## 👉 Where we are right now
>
> - **Current phase**: ⏭ **Phase 3 — Managed Agents integration** (next up; not started)
> - **Last completed**: ✅ Phase 2 — Engine MVP (21/21 Vitest tests passing, CLI scaffolding works)
> - **Last verified locally**: **2026-04-29** — fresh clone on `main`: `pnpm install` / `typecheck` / `test` / `build` all green; `init`+`status` smoke-test in a temp dir works.
> - **Canonical source of truth**: `.claude/STATUS.md` — read this BEFORE acting; it has the full "next action" checklist for Phase 3. If it disagrees with this file, STATUS.md wins.

## What this repo is

**Product Maker** is an autonomous multi-agent system that builds complete, tested, deployed products while the user sleeps. A user describes a product, kicks off the loop, and comes back hours later to a working PR.

The repo is mid-transition between two major versions:

- **v1**: a Claude Code plugin based on a single-Claude bash loop (Geoffrey Huntley's "Ralph Wiggum" technique). Stop-hook intercepts exit attempts and re-feeds the prompt. Works, shipped, v1.1.0. Code still lives at the repo root and is preserved on branch `v1-legacy`.
- **v2 (in active development)**: a multi-agent orchestration on top of **Claude Managed Agents** (Anthropic's hosted agent service). An Orchestrator agent (Opus 4.7) spawns Executor (Sonnet 4.6) and Tester (Opus 4.7 + Playwright + vision) sub-sessions via custom tools. TypeScript monorepo. Published as npm package + thin Claude Code plugin.

**Phase progress** (see `.claude/ROADMAP.md` for full detail):
- ✅ Phase 0 — Foundation docs
- ✅ Phase 1 — Monorepo transformation (`packages/{engine,skills-library,plugin}`)
- ✅ Phase 2 — Engine MVP (local CLI, no API calls — `init`/`status`/`build`/`watch`/`cancel`, 21 Vitest tests passing)
- ⏭ **Phase 3 — Managed Agents integration (← we are here, not started)**
- ⬜ Phases 4-8 — Visual QA, skills library, plugin wrapper, E2E, publish

**Branch state**: Phase 0-2 work was merged into `main` via PR #1 (commit `56593b2`, 2026-04-21), so `main` now contains both v1 (root) and v2 (`packages/`) side-by-side. v1 code is preserved on branch `v1-legacy` and will not be deleted until v2 ships. Future v2 work (starting with Phase 3) should be done on a new feature branch — do not push WIP directly to `main` until Phase 8.

## Read this first, then dive deeper

1. This file — high-level orientation (you're here)
2. `.claude/STATUS.md` — **what phase we're in right now, what's the next action**
3. `.claude/ROADMAP.md` — full phased plan from v1 to v2 ship
4. `.claude/ARCHITECTURE.md` — v2 design in detail (diagrams, agent roles, event flow, visual QA)
5. `.claude/DECISIONS.md` — ADR-style log of architectural decisions and why
6. `.claude/settings.json` — pre-approved permissions for v2 development work

Humans looking for product docs should go to `README.md`, `PROJECT-OVERVIEW.md`, `EXAMPLES.md`, `QUICKSTART.md`, `INSTALL.md`, `LEEME-PRIMERO.md` (Spanish).

## Current repo layout

### v1 artifacts (still functional)

| Path | Purpose |
|---|---|
| `.claude-plugin/plugin.json` | Plugin manifest (v1.1.0) |
| `commands/` | 4 slash commands: `build-product`, `cancel`, `test-status`, `help` |
| `hooks/hooks.json` | Registers the stop-hook |
| `scripts/stop-hook.sh` | **The v1 engine** — 504 lines of bash that implements the Ralph loop |
| `scripts/setup-product-loop.sh` | Initializes `.product-maker-state.yaml` |
| `scripts/cancel-loop.sh` | Deactivates the loop |
| `scripts/test-status.sh` | Parses TESTLOG.md |

### v2 artifacts (existing — Phase 2 complete)

```
packages/
├── engine/                    @spicy/product-maker (TypeScript CLI)
│   ├── bin/product-maker.mjs  shebang entry → dist/cli.js
│   ├── src/
│   │   ├── cli.ts             commander entry, 5 commands
│   │   ├── config.ts          Zod schema for product-maker.config.{json,mjs,js}
│   │   ├── state.ts           Zod schema for .product-maker/state.json
│   │   ├── logger.ts          JSON-lines → stream.log + colored console
│   │   ├── index.ts           public API surface
│   │   └── commands/{init,build,status,watch,cancel}.ts
│   ├── tests/                 21 Vitest tests (helpers.ts + 7 test files)
│   ├── tsconfig.json          composite, emits to dist/
│   ├── tsconfig.test.json     noEmit, includes src + tests
│   └── vitest.config.ts
├── skills-library/            @spicy/skills-library (empty — filled in Phases 4-5)
└── plugin/                    @spicy/product-maker-plugin (stub — filled in Phase 6)
```

Root: `package.json` (workspaces), `pnpm-workspace.yaml`, `tsconfig.base.json`, `tsconfig.json` (project references), `pnpm-lock.yaml`.

**Engine commands wired (Phase 2)** — all functional, but `build` / `watch` / `cancel` are deliberately partial stubs until Phase 3 plugs in Managed Agents:

| Command | Phase 2 behavior | Phase 3 upgrade |
|---|---|---|
| `init` | Real. Scaffolds `.product-maker/`, `product-maker.config.json`, `CLAUDE.md` | Also creates 3 Managed Agents + environment, persists IDs |
| `status` | Real. Reads state, pretty-prints (supports `--json`) | Unchanged |
| `build` | Stub. Loads config + prints summary | Opens SSE session, spawns Orchestrator, handles custom tools |
| `watch` | Static tail of `stream.log` (last N lines) | Live SSE reconnect with lossless replay |
| `cancel` | Flips `state.cancelled = true` (idempotent) | Also sends `user.interrupt` to live session |

## Key conventions

### When working on v2

- **Language**: TypeScript only. Target Node 20+. Use ESM (`"type": "module"`).
- **Package manager**: pnpm (workspaces).
- **Model IDs**: `claude-opus-4-7` (orchestrator + tester), `claude-sonnet-4-6` (executor). Never date-suffix aliases.
- **Thinking config**: `{type: "adaptive"}` only. Never `{type: "enabled", budget_tokens: N}` (removed on Opus 4.7).
- **Effort**: `xhigh` for Orchestrator+Tester, `medium` for Executor.
- **Beta header**: `managed-agents-2026-04-01` (SDK sets automatically).
- **Agents are persistent**: create once, reuse by ID. Never call `agents.create()` in the request path.
- **Sessions reference agents by ID or `{type: "agent", id, version}`** — no inline agent config on sessions.

### When touching v1 bash scripts

- `set -euo pipefail` at top
- Timestamp every log line (`date -u +%Y-%m-%dT%H:%M:%SZ`)
- State lives in `.product-maker-state.yaml` (no external YAML parser — use grep/sed)
- Stop-hook exit codes: `0` = allow exit, `2` = continue loop
- Don't break v1 semantics. If you change v1, add a test or explain why in the commit message.

### Shared conventions (v1 + v2)

- `CLAUDE.md` in a user's project = product spec + cross-session memory for their project (different file, same name — don't confuse with *this* CLAUDE.md)
- `TESTLOG.md` = QA findings, append-only, severity-tagged
- Commits should be atomic and descriptive. No "wip" / "fix" / "update" commits.

## Working on the v2 engine locally

All commands run from repo root unless noted.

```bash
# One-time setup
pnpm install

# Edit code in packages/engine/src/ or tests in packages/engine/tests/

# Type-check everything (src + tests)
pnpm typecheck

# Build (tsc -b emits to packages/engine/dist/)
pnpm build

# Run the test suite
pnpm test

# Smoke-test the CLI against a throwaway directory
SMOKE=$(mktemp -d)
node packages/engine/bin/product-maker.mjs -C "$SMOKE" init --name demo --stack nextjs-supabase
node packages/engine/bin/product-maker.mjs -C "$SMOKE" status
node packages/engine/bin/product-maker.mjs -C "$SMOKE" status --json
rm -rf "$SMOKE"
```

**Editing the CLI**: after any change under `packages/engine/src/`, run `pnpm build` before re-invoking the bin script — the bin imports `dist/`, not `src/`. Vitest runs directly against `src/` so tests don't need a rebuild.

**Adding a dependency to engine**: `pnpm --filter @spicy/product-maker add <pkg>` (runtime) or `... add -D <pkg>` (dev).

**TypeScript strictness**: `tsconfig.base.json` has `exactOptionalPropertyTypes: true` and `verbatimModuleSyntax: true`. Concretely:
- Use `import type` for type-only imports, `import` for values
- Don't assign `undefined` to `field?: T` — omit the field instead, or use `field: T | null` if nullability is semantic

**Schemas**: state and config go through Zod at every read (`StateSchema.parse` / `ConfigSchema.safeParse`). If you change the shape, bump `schemaVersion` in `state.ts` and add a migration path before merging.

## How v2 will be used (end-to-end)

```bash
# User creates a new product
npx create-product-maker my-saas-app --stack nextjs-supabase

# User edits my-saas-app/CLAUDE.md with product description + completion promise

# User kicks off the loop
cd my-saas-app
npx @spicy/product-maker build
# OR from Claude Code: /pm:build

# Loop runs on Anthropic infrastructure. User's laptop can close.
# Later:
npx @spicy/product-maker status    # summary
npx @spicy/product-maker watch     # re-connect to SSE stream
```

The engine creates 3 Managed Agents:
- **Orchestrator** (Opus 4.7, persistent long-lived session) — reads CLAUDE.md, plans, delegates
- **Executor** (Sonnet 4.6, spawned per task) — implements, commits, pushes
- **Tester** (Opus 4.7 + Playwright, spawned per review) — tests functional + visual, logs to TESTLOG.md

Orchestrator uses custom tools (`spawn_executor`, `spawn_tester`) that your CLI intercepts and maps to new sub-sessions. Communication medium is `CLAUDE.md` + `TESTLOG.md` in the user's repo (mounted via `github_repository` resource).

## Glossary (to avoid confusion)

| Term | Meaning in this repo |
|---|---|
| **v1** | The existing bash-based Claude Code plugin (on `main` today). |
| **v2** | The TypeScript + Managed Agents redesign (being built). |
| **Engine** | The v2 npm package that orchestrates everything. |
| **Orchestrator** | The Opus 4.7 agent in v2 that plans + delegates. Persistent session. |
| **Executor / Tester** | v2 sub-agents spawned by the Orchestrator via custom tools. |
| **Managed Agents** | Anthropic's hosted agent service. `client.beta.{agents,environments,sessions,vaults}`. See `/claude-api managed-agents-onboard` skill. |
| **Skills** | Progressive-disclosure context bundles. First-class in Managed Agents. Stack knowledge lives here per project. |
| **`CLAUDE.md` (user project)** | Product spec + Orchestrator memory in the user's repo. Not this file. |
| **`.product-maker-state.yaml`** | v1 state file (bash scripts). |
| **`.product-maker/state.json`** | v2 state file (engine). Different file, different format. |
| **Completion promise** | A string the Orchestrator must write (e.g., "DEPLOYED") before the loop can exit. |
| **Ralph Wiggum** | The v1 technique: re-inject the same prompt every iteration. v2 does NOT do this — each sub-agent has its own prompt. |

## What NOT to do

- Don't delete v1 code until v2 is functionally superior and published. v1 users exist.
- Don't rename the repo without a migration plan — npm/GitHub references would break.
- Don't add `date_suffixed` model IDs (e.g., `claude-opus-4-7-20260415`) — use aliases.
- Don't use `budget_tokens` on Opus 4.7 (returns 400).
- Don't call `agents.create()` on every build — create once at `pm init`, store ID in `.product-maker/state.json`.
- Don't put API keys in `CLAUDE.md` or user messages — the session's event history persists them.
- Don't pipe the full SSE event stream into the Claude Code plugin's context. See "cost tradeoff" in `ARCHITECTURE.md`.

## If you're stuck

- "What phase? What next?" → `.claude/STATUS.md`
- Full phased plan → `.claude/ROADMAP.md`
- Architecture question → `.claude/ARCHITECTURE.md`
- "Why did we choose X?" → `.claude/DECISIONS.md`
- Managed Agents SDK details (for Phase 3) → invoke the `claude-api` skill (`/claude-api managed-agents-onboard`)
- Engine code layout / CLI entry → `packages/engine/src/cli.ts` (commander setup)
- Config or state shape → `packages/engine/src/{config,state}.ts` (Zod schemas are the source of truth)
- "How do I add a command?" → copy a file from `packages/engine/src/commands/`, register it in `cli.ts`, add a test in `tests/`
- v1 behavior clarification → read `scripts/stop-hook.sh` top-to-bottom
