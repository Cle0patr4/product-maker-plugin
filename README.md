# Product Maker

**Autonomous multi-agent product builder. Describe a product, kick off the loop, wake up to a shipped PR.**

---

## Status

**v1.1.0** — bash-based Claude Code plugin. Stable, installable, shipped. [Install below](#using-v1-stable-today).

**v2.0.0-alpha** — TypeScript engine on top of Anthropic's **Claude Managed Agents** (beta). Multi-agent orchestration across Orchestrator / Executor / Tester sub-sessions. In active development. **Not production-ready yet** — Phases 0-2 of 8 done; real API integration lands in Phase 3. See [`CLAUDE.md`](./CLAUDE.md) and [`.claude/ROADMAP.md`](./.claude/ROADMAP.md).

---

## What v2 is

A TypeScript CLI + thin Claude Code plugin that orchestrates three Anthropic-hosted agents to build complete products autonomously. The loop runs on Anthropic's infrastructure, so your laptop can close.

- **Orchestrator** (Opus 4.7) — reads your `CLAUDE.md`, plans the work, delegates. Single long-lived session.
- **Executor** (Sonnet 4.6) — implements features, commits, pushes. Spawned per task by the Orchestrator.
- **Tester** (Opus 4.7 + Playwright + vision) — verifies functional + visual correctness. Spawned per review.

Sub-agent coordination happens through **custom tools** (`spawn_executor`, `spawn_tester`) that the local engine intercepts and maps to new sub-sessions. Shared state lives in two files inside the target repo:

- **`CLAUDE.md`** — product spec (you write it) and Orchestrator memory (it appends to it).
- **`TESTLOG.md`** — QA findings, append-only, severity-tagged.

The target repo is mounted into each session via Anthropic's `github_repository` resource. No local build servers; no `npm run dev` on your laptop.

### How it will feel to use

```bash
# Create a project
npx create-product-maker my-saas --stack nextjs-supabase
cd my-saas

# Edit CLAUDE.md with what you want built and a completion promise

# Start the loop — close your laptop after this
npx @spicy/product-maker build
# or from Claude Code:  /pm:build

# Check in later
npx @spicy/product-maker status
npx @spicy/product-maker watch
```

### Phase progress

| | Phase | Scope |
|---|---|---|
| ✅ | 0 | Foundation docs (`CLAUDE.md`, `.claude/{STATUS,ROADMAP,ARCHITECTURE,DECISIONS}.md`) |
| ✅ | 1 | Monorepo scaffolding (`packages/engine`, `packages/skills-library`, `packages/plugin`) |
| ✅ | 2 | Engine CLI, local-only: `init`, `status`, `build` (stub), `watch` (static), `cancel` + 21 Vitest tests |
| ⏭ | 3 | Managed Agents integration — create agents at `init`, real build loop with SSE streaming |
| ⬜ | 4 | Visual QA (Playwright + vision) |
| ⬜ | 5 | Skills library, first stack: Next.js + Supabase + Tailwind |
| ⬜ | 6 | Claude Code plugin wrapper |
| ⬜ | 7 | E2E dogfooding |
| ⬜ | 8 | Publish to npm + Claude Code marketplace |

Full plan: [`.claude/ROADMAP.md`](./.claude/ROADMAP.md). Current working state: [`.claude/STATUS.md`](./.claude/STATUS.md).

### Trying the Phase-2 CLI locally

Nothing talks to Anthropic yet, but the local scaffolding works. From the repo root:

```bash
pnpm install
pnpm build

SMOKE=$(mktemp -d)
node packages/engine/bin/product-maker.mjs -C "$SMOKE" init --name demo --stack nextjs-supabase
node packages/engine/bin/product-maker.mjs -C "$SMOKE" status
rm -rf "$SMOKE"
```

Type-checking and tests:

```bash
pnpm typecheck
pnpm test   # 21 tests across config, state, and all 5 commands
```

---

## Using v1 (stable today)

v1 is a single-process Claude Code plugin: you run a slash command, and the plugin's stop-hook keeps Claude working on your product across exit attempts until a completion promise is met. v1.1.0 adds an integrated **QA Tester** that alternates BUILDER and TESTER roles, writing findings to `TESTLOG.md` and blocking completion while critical bugs remain open.

### Install

```bash
# Option 1 — marketplace (coming soon)
/plugin install product-maker@spicy-automations

# Option 2 — manual
cp -r product-maker-plugin ~/.claude/plugins/product-maker
chmod +x ~/.claude/plugins/product-maker/scripts/*.sh
```

Then reload Claude Code.

### Run

```bash
/product-maker:build-product "Build a task management SaaS with auth, projects, tasks, and team collaboration" \
  --max-iterations 100 \
  --completion-promise "DEPLOYED"
```

### Commands

| Command | What it does |
|---|---|
| `/product-maker:build-product <prompt> [opts]` | Start the autonomous loop |
| `/product-maker:test-status` | Show current QA bug counts (CRITICAL / MEDIUM / LOW / FIXED) |
| `/product-maker:cancel` | Stop the loop gracefully after the current iteration |
| `/product-maker:help` | Full help with flag reference and examples |

### Key flags

- `--max-iterations <N>` — hard cap (default `100`)
- `--completion-promise "<text>"` — exact string the loop must produce to exit
- `--with-tester` / `--no-tester` — toggle QA mode (default on)
- `--test-every <N>` — tester cadence (default every 2 iterations)
- `--enable-reflection` — iteration logging + checkpoints

### Safety mechanisms (preserved in v2)

- Max-iteration cap prevents runaway loops
- Explicit completion promise — no fuzzy "done" detection
- Critical-bug blocker — won't complete while CRITICAL bugs remain in `TESTLOG.md`
- Git commits after every iteration — nothing gets lost
- Graceful cancellation + crash-resilient state

### Deeper v1 docs

- [`QUICKSTART.md`](./QUICKSTART.md) — 5-minute walkthrough
- [`INSTALL.md`](./INSTALL.md) — installation details
- [`EXAMPLES.md`](./EXAMPLES.md) — prompt patterns for SaaS / API / landing / internal tools
- [`PROJECT-OVERVIEW.md`](./PROJECT-OVERVIEW.md) — architecture + philosophy
- [`LEEME-PRIMERO.md`](./LEEME-PRIMERO.md) — en español

v1 source lives at the repo root (`commands/`, `hooks/`, `scripts/`) and is frozen until v2 ships. The `v1-legacy` git branch pins the last v1-only commit as a permanent safety net.

---

## Contributing

v2 development happens on feature branches — see [`CLAUDE.md`](./CLAUDE.md) for contributor orientation (code layout, TypeScript strictness gotchas, local dev workflow). Keep commits atomic and descriptive; no `wip` / `fix` / `update`.

## License

MIT — build whatever you want.

## Credits

- **v1 loop technique**: inspired by Geoffrey Huntley's "Ralph Wiggum" pattern (prompt re-injection per iteration).
- **v2 architecture**: designed around Anthropic's Claude Managed Agents (beta).
- **Built by**: Ale @ Spicy Automations.
