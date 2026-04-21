# Product Maker — Onboarding for Claude

This file is the first thing any future Claude session should read when working in this repo. It's written for Claude, not humans — humans have `README.md`.

## What this repo is

**Product Maker** is an autonomous multi-agent system that builds complete, tested, deployed products while the user sleeps. A user describes a product, kicks off the loop, and comes back hours later to a working PR.

The repo is currently mid-transition between two major versions:

- **v1 (current `main`)**: a Claude Code plugin based on a single-Claude bash loop (Geoffrey Huntley's "Ralph Wiggum" technique). Stop-hook intercepts exit attempts and re-feeds the prompt. Works, shipped, v1.1.0.
- **v2 (being designed)**: a multi-agent orchestration on top of **Claude Managed Agents** (Anthropic's hosted agent service). An Orchestrator agent (Opus 4.7) spawns Executor (Sonnet 4.6) and Tester (Opus 4.7 + Playwright + vision) sub-sessions via custom tools. TypeScript monorepo. Published as npm package + thin Claude Code plugin.

v1 code is preserved in branch `v1-legacy` and still lives in `main` until v2 replaces it.

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

### v2 artifacts (to be created)

Target structure, set up incrementally during Phase 1 of the roadmap:

```
packages/
├── engine/              # @spicy/product-maker — the TypeScript CLI + orchestrator
├── skills-library/      # reusable skills (nextjs-supabase, visual-qa, ...)
└── plugin/              # thin Claude Code plugin wrapping the engine
```

`package.json` + `pnpm-workspace.yaml` at root.

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

- Architecture question → `.claude/ARCHITECTURE.md`
- "Why did we choose X?" → `.claude/DECISIONS.md`
- "What's next?" → `.claude/STATUS.md`
- Managed Agents SDK details → invoke the `claude-api` skill (`/claude-api managed-agents-onboard`)
- v1 behavior clarification → read `scripts/stop-hook.sh` top-to-bottom
