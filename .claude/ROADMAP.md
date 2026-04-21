# Roadmap — v1 bash plugin → v2 TypeScript + Managed Agents

Phased plan for the v2 rewrite. Each phase has a clear goal, concrete deliverables, and explicit success criteria. **Phases are mostly sequential** — don't skip ahead.

**Rule of thumb**: each phase should be 1-3 working sessions. If a phase is taking longer, split it.

---

## Phase 0 — Foundation docs ✅ DONE

**Goal**: future Claude sessions can orient themselves and continue work without re-discussing architecture.

**Deliverables**:
- [x] `CLAUDE.md` at repo root
- [x] `.claude/STATUS.md` — live status
- [x] `.claude/ROADMAP.md` — this file
- [x] `.claude/ARCHITECTURE.md` — v2 design in depth
- [x] `.claude/DECISIONS.md` — ADRs captured
- [x] `.claude/settings.json` — pre-approved permissions
- [x] `v1-legacy` branch created as safety net
- [x] `package.json` + `pnpm-workspace.yaml` skeleton

**Success criteria**: A new Claude session reading only `CLAUDE.md` can identify the current phase, the next action, and where to find the detailed design.

---

## Phase 1 — Monorepo transformation ✅ DONE

**Goal**: repo layout ready for TypeScript code. No engine logic yet.

**Deliverables**:
- [x] `packages/engine/` with its own `package.json`, `tsconfig.json`, `src/index.ts` (empty export)
- [x] `packages/skills-library/` with its own `package.json` + an initial `skills/` subfolder (empty)
- [x] `packages/plugin/` with its own `package.json` + `.claude-plugin/plugin.json` stub
- [x] Root `tsconfig.json` + `tsconfig.base.json` with project references
- [x] `.gitignore` extended for `node_modules/`, `dist/`, `.turbo/`, etc. (done in Phase 0)
- [x] v1 files left at root (see ADR-012 — rationale documented)
- [x] `README.md` updated with "v2 in progress" banner pointing to `CLAUDE.md`
- [x] `pnpm install` runs clean
- [x] `pnpm build` and `pnpm typecheck` both succeed

**Decision captured**: ADR-012 — leave v1 at root, v2 lives under `packages/`. Next major release deletes v1 from `main`; `v1-legacy` branch retains it for posterity.

**Success criteria met**: `pnpm build` + `pnpm typecheck` pass on a fresh clone. v1 plugin still installable (paths unchanged).

**Actual effort**: <1 session (same session as Phase 0).

---

## Phase 2 — Engine MVP (local scaffolding, no API calls yet) ✅ DONE

**Goal**: the CLI skeleton works — it accepts commands, reads/writes state, logs structured events. No Anthropic API calls yet.

**Deliverables** (all in `packages/engine/`):
- [x] `src/cli.ts` — commander entry point. Commands: `init`, `build`, `status`, `watch`, `cancel`.
- [x] `src/config.ts` — loads and validates `product-maker.config.{json,mjs,js}` with Zod.
- [x] `src/state.ts` — read/write `.product-maker/state.json` (Zod-validated schema v1).
- [x] `src/logger.ts` — structured JSON-lines logging to `.product-maker/logs/stream.log` + colored console.
- [x] `src/commands/init.ts` — scaffolds `.product-maker/`, config, placeholder `CLAUDE.md`.
- [x] `src/commands/build.ts` — **stub**: loads config, prints summary, exits (Phase 3 replaces).
- [x] `src/commands/status.ts` — reads state, prints summary + `--json` flag.
- [x] `src/commands/watch.ts` — static tail of stream.log (live SSE tail in Phase 3).
- [x] `src/commands/cancel.ts` — marks state `cancelled: true` (Phase 3 adds `user.interrupt`).
- [x] `bin/product-maker.mjs` — shebang executable wrapping `dist/cli.js`.
- [x] Vitest suite — 21 tests across config, state, and all 5 commands.

**Dependencies added**:
- `@anthropic-ai/sdk@^0.90.0` (used in Phase 3)
- `zod@^4`
- `commander@^14`
- `chalk@^5`
- `ora@^9`
- `execa@^9`
- Dev: `vitest@^4`

Note: `tsup` from the original plan was skipped — plain `tsc -b` produces clean output without a bundler, and the CLI's deps stay external by design. Can revisit at publish time (Phase 8) if we want a single-file artifact.

**Config format**: JSON-first in Phase 2 (`product-maker.config.json`). The loader also accepts `.mjs`/`.js` via dynamic import. A `.ts` variant can be added later with a loader shim.

**Success criteria** (all met):
- [x] `product-maker init` creates `.product-maker/`, `product-maker.config.json`, and `CLAUDE.md`
- [x] `product-maker status` prints a formatted summary
- [x] `product-maker build` prints the Phase 2 stub message
- [x] `product-maker cancel` flips state to `cancelled` idempotently
- [x] `product-maker watch -n N` tails the stream log
- [x] `pnpm build`, `pnpm typecheck`, `pnpm test` all pass workspace-wide

**Actual effort**: 1 session.

---

## Phase 3 — Managed Agents integration

**Goal**: `build` actually creates Managed Agents, mounts the repo, and starts the loop. No visual QA yet — functional only.

**Deliverables** (in `packages/engine/`):
- [ ] `src/agents/orchestrator.ts` — creates the Orchestrator agent (Opus 4.7, adaptive thinking, `effort: "xhigh"`). System prompt template.
- [ ] `src/agents/executor.ts` — creates the Executor agent (Sonnet 4.6, `effort: "medium"`). System prompt.
- [ ] `src/agents/tester.ts` — creates the Tester agent (Opus 4.7, `effort: "high"`, no Computer Use yet). System prompt.
- [ ] `src/agents/setup.ts` — `init` command creates all 3 agents + environment, persists IDs to state.
- [ ] `src/session/orchestrator-session.ts` — `build` command creates Orchestrator session with `github_repository` resource, opens SSE stream, sends kickoff.
- [ ] `src/session/stream-handler.ts` — routes SSE events. Special handling for `agent.custom_tool_use` → spawn sub-session.
- [ ] `src/session/subagent-router.ts` — when Orchestrator calls `spawn_executor` / `spawn_tester`, creates a new session for that agent, waits for completion, returns summary to Orchestrator via `user.custom_tool_result`.
- [ ] Custom tool schemas for `spawn_executor(task_description)` and `spawn_tester(focus)` on the Orchestrator agent.
- [ ] `src/commands/watch.ts` — real implementation: reconnect SSE + event list for lossless replay.
- [ ] `src/commands/cancel.ts` — real implementation: send `user.interrupt` to session.

**Critical implementation notes** (see `ARCHITECTURE.md` for depth):
- **Stream-first ordering**: open SSE stream *before* sending kickoff message, or early events arrive buffered in a single batch.
- **Lossless reconnect**: on reconnect, fetch `events.list()` history *before* consuming the live stream, dedupe by event ID.
- **Correct idle-break gate**: break on `session.status_terminated` OR (`session.status_idle` AND `stop_reason.type !== 'requires_action'`). See client patterns doc in `claude-api` skill.
- **Agents persistent**: create at `init` time, reuse by ID on every `build`. NEVER call `agents.create()` during build.
- **GitHub PAT**: read from `GITHUB_TOKEN` env var for `github_repository` resource. Document in config.

**Success criteria**:
- `product-maker init` in a test repo creates Managed Agents (visible in Anthropic dashboard), persists IDs
- `product-maker build` starts loop; Orchestrator spawns Executor, Executor commits to mounted repo, commits visible on GitHub
- SSE stream renders in terminal with clean event formatting
- Can cancel mid-loop cleanly
- Can disconnect and reconnect without losing events

**Estimated effort**: 3-5 sessions. This is the meatiest phase.

---

## Phase 4 — Visual QA (Playwright + vision)

**Goal**: Tester agent performs visual analysis using real browser screenshots.

**Deliverables**:
- [ ] `packages/skills-library/skills/visual-qa/SKILL.md` — short description + capabilities.
- [ ] `packages/skills-library/skills/visual-qa/playbook.md` — detailed instructions on how to run visual QA (viewports, heuristics, severity mapping).
- [ ] `packages/skills-library/skills/visual-qa/scripts/capture-screenshots.mjs` — Playwright script template the Tester copies into the project's `.product-maker/scripts/` and customizes.
- [ ] Environment config that pre-installs Node + Playwright + Chromium (see Managed Agents environments doc).
- [ ] Tester agent system prompt updated to reference the `visual-qa` skill.
- [ ] Engine `init` uploads `visual-qa` skill via Skills API, references in Tester agent config.
- [ ] Flag `--visual-qa` on `build` command that enables visual QA (opt-in per ADR-010).
- [ ] Tester's spawn input includes `visual: boolean` — Orchestrator decides per-review.

**Implementation notes**:
- Tester session flow:
  1. `bash`: start dev server (`npm run dev &`) — Tester must know the stack's dev command, which comes from the project's stack skill (e.g., `nextjs-supabase`).
  2. `bash`: wait for localhost to respond
  3. `bash`: run Playwright script → screenshots saved to `/tmp/screenshots/`
  4. Tester uses `read` tool on each PNG (Opus 4.7 vision analyzes)
  5. Findings appended to `TESTLOG.md` with severity + screenshot reference
- Screenshots published: either committed to the repo or uploaded via Files API with `scope_id=session.id`.
- Cost: a Tester run with visual QA is the most expensive sub-session. Cap at `--visual-qa-every N iterations` (default 5).

**Success criteria**:
- On a test Next.js project, Tester identifies an intentionally broken layout (e.g., button overflow) and logs it in TESTLOG.md
- Screenshots are viewable after session ends

**Estimated effort**: 2-3 sessions.

---

## Phase 5 — Skills library + first stack skill (Next.js + Supabase + Tailwind)

**Goal**: the first complete per-project skill that teaches the Orchestrator/Executor/Tester how to build Next.js + Supabase apps well.

**Deliverables** (in `packages/skills-library/skills/nextjs-supabase/`):
- [ ] `SKILL.md` — one-paragraph description, "use when" trigger, list of sub-docs.
- [ ] `project-structure.md` — canonical folder layout (`src/app/`, `src/lib/`, `src/components/`, etc.).
- [ ] `supabase-auth.md` — auth patterns, RLS, server components vs client components.
- [ ] `data-fetching.md` — SSR patterns, caching, mutations.
- [ ] `ui-patterns.md` — Tailwind conventions, reusable components, shadcn/ui integration.
- [ ] `testing.md` — how to test Next.js + Supabase (Vitest, Playwright).
- [ ] `deployment.md` — Vercel deploy, env vars, Supabase project linking.
- [ ] `common-pitfalls.md` — things that trip up LLMs (cookies in server components, Suspense boundaries, etc.).
- [ ] CLI command `product-maker add-skill nextjs-supabase` that copies this skill into the user's project `skills/` folder.

**Success criteria**:
- End-to-end test: create a new repo, run `init --stack nextjs-supabase`, write CLAUDE.md with a simple app spec, run `build`. Output: a functioning Next.js + Supabase app committed to GitHub with auth working.

**Estimated effort**: 2-3 sessions (skill authoring is writing-heavy).

---

## Phase 6 — Plugin thin wrapper

**Goal**: Claude Code users can invoke the engine via slash commands.

**Deliverables** (in `packages/plugin/`):
- [ ] `.claude-plugin/plugin.json` — v2 manifest, references new commands.
- [ ] `commands/pm-build.md` — slash command that runs `!npx @spicy/product-maker build` as a Bash call.
- [ ] `commands/pm-status.md` — runs `product-maker status`, parses output, displays summary. **Does NOT pipe full stream** (see ADR about Claude Code context cost).
- [ ] `commands/pm-tail.md` — reads last N lines of `.product-maker/logs/stream.log`.
- [ ] `commands/pm-cancel.md` — runs `product-maker cancel`.
- [ ] `commands/pm-watch.md` — tells user to open terminal and run `product-maker watch` (don't stream into Claude Code context).

**Success criteria**:
- From Claude Code in a v2 product-maker project, `/pm:build` starts the loop and the user sees a compact confirmation (not the full stream).

**Estimated effort**: 0.5-1 session.

---

## Phase 7 — E2E testing + dogfooding

**Goal**: the engine actually ships a real product end-to-end without human intervention.

**Deliverables**:
- [ ] Test project #1: TODO app with auth (Next.js + Supabase). 100-iter cap. Should complete with working app + tests + deployed to Vercel.
- [ ] Test project #2: small SaaS with Stripe. Validates MCP server integration (Stripe via MCP or custom tool).
- [ ] Cost reporting: actual $ spend documented for each test.
- [ ] Failure mode catalog: what common failures look like, how Orchestrator recovers (or doesn't).

**Success criteria**: 2 completed projects from scratch with zero code written by a human during the loop.

**Estimated effort**: multiple sessions, iterative.

---

## Phase 8 — Publish + docs

**Goal**: public v2 release.

**Deliverables**:
- [ ] `packages/engine/` published to npm as `@spicy/product-maker@2.0.0`
- [ ] `packages/plugin/` published in Claude Code plugin marketplace (or equivalent)
- [ ] New `README.md` for v2 at repo root (v1 README moved to `v1-legacy` branch only)
- [ ] Docs site or comprehensive GitHub README with: installation, init, build, config reference, skills authoring guide, troubleshooting
- [ ] Video walkthrough (5-10 min)
- [ ] Changelog + migration guide for v1 users
- [ ] Announcement post

**Success criteria**: a user with zero context can read docs, install, and ship their first product with the tool.

**Estimated effort**: 1-2 sessions + asynchronous community feedback.

---

## Notes on priority

If time is tight, the minimum viable v2 is: **Phases 0-3 + a minimal visual QA in Phase 4**. That's enough to prove the concept. Phases 5-8 are value multipliers.

Phases can parallelize across multiple Claude sessions if they're truly independent (e.g., Phase 5 skill authoring can happen while someone else works on Phase 4 engine visual QA).
