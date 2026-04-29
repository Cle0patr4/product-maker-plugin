# Status — live working state

> This file is short on purpose. Keep it updated as work progresses. Detailed plan is in `ROADMAP.md`.

**Last updated**: 2026-04-29
**Current branch**: `main` (Phase 0-2 was merged via PR #1, commit `56593b2`, on 2026-04-21). Phase 3 work should open a new feature branch.
**Current phase**: Phase 2 — Engine MVP ✅ **DONE** and end-to-end verified locally on 2026-04-29 (`pnpm install` / `typecheck` / `test` 21/21 / `build` / `init`+`status` smoke-test all green). Next up: Phase 3 — Managed Agents integration (not started).

---

## Where we are

Phases 0, 1, and 2 complete. The engine package is a functional local CLI with no API calls yet.

- Onboarding docs: `CLAUDE.md` + `.claude/`
- Monorepo: `packages/{engine,skills-library,plugin}`
- **Engine CLI is alive**: `product-maker {init,build,status,watch,cancel}` all wired
  - `init` scaffolds `.product-maker/`, `product-maker.config.json`, and a starter `CLAUDE.md`
  - `status` reads `.product-maker/state.json` (Zod-validated) and prints a summary (plus `--json`)
  - `build` is a Phase 2 stub that loads config and prints a summary
  - `cancel` flips state to `cancelled`
  - `watch -n N` tails the JSON-lines stream log (live tail arrives in Phase 3)
- Logger emits JSON lines to `.product-maker/logs/stream.log` + colored console (stderr)
- Config loader: Zod schema with sensible defaults (`maxIterations: 100`, `visualQA.enabled: false`, etc.)
- 21 Vitest tests — covers all commands + config + state I/O
- Workspace-wide `pnpm install`, `pnpm build`, `pnpm typecheck`, `pnpm test` all pass

## Next action

**Start Phase 3**: Managed Agents integration — the real engine. See `ROADMAP.md` Phase 3.

Concretely, the next Claude session should:

1. Invoke the `claude-api` skill for Managed Agents onboarding context
2. In `packages/engine/src/agents/`, create `orchestrator.ts`, `executor.ts`, `tester.ts` — each exports a factory that creates the agent via `client.beta.agents.create()`
3. Extend `init` so it **also** creates the 3 agents + environment on first run and persists IDs to state (guarded — never re-create if IDs already exist)
4. In `packages/engine/src/session/`, build:
   - `orchestrator-session.ts` — opens the SSE stream **before** sending kickoff
   - `stream-handler.ts` — routes events, special-cases `agent.custom_tool_use`
   - `subagent-router.ts` — spawns Executor/Tester sub-sessions and returns results via `user.custom_tool_result`
5. Custom tool schemas on the Orchestrator: `spawn_executor(task_description)`, `spawn_tester(focus, visual?)`
6. Replace the Phase 2 stubs in `build.ts`, `watch.ts`, `cancel.ts` with real implementations
7. Add integration tests mocked against the SDK (don't hit real API in CI)
8. Manual smoke test with a throwaway Anthropic key before merging

**Prerequisites**:
- `ANTHROPIC_API_KEY` in env for local testing
- `GITHUB_TOKEN` for `github_repository` resource
- Beta header `managed-agents-2026-04-01` (SDK handles this)

Do NOT add visual QA yet — that's Phase 4.

## Recent changes (reverse chronological)

- **2026-04-29** — Fresh clone verified end-to-end on a new machine: `pnpm install` (4 workspaces, 91 pkgs), `pnpm typecheck`, `pnpm test` (21/21), `pnpm build` (dist emitted), and `init`+`status` smoke-test in a temp dir all pass. `.env` set up locally with `ANTHROPIC_API_KEY`. CLAUDE.md refreshed to mark current phase prominently.
- **2026-04-21** — **PR #1 merged** (`56593b2`): Phase 0-2 work landed in `main`. Branch `claude/read-understand-repo-r0JSG` is no longer the active dev branch.
- **2026-04-21** — **Phase 2 complete**: engine CLI with 5 commands, Zod-validated state + config, structured logger, 21 Vitest tests.
- **2026-04-21** — Phase 1: monorepo scaffolding + project references + v2 banner + ADR-012.
- **2026-04-21** — Foundation docs created (Phase 0). v1 preserved on branch `v1-legacy`.
- **2026-04-21** — Design session: resolved v2 architecture. See `DECISIONS.md` for all 12 ADRs captured.
- **Pre-2026-04-21** — v1.1.0 shipped: integrated QA Tester mode with builder/tester alternation (commit `6dbb17b`).

## Pending decisions

None currently. All 12 v2 design decisions are resolved and documented in `DECISIONS.md`.

**Future sessions may encounter new decisions.** If so, document them in `DECISIONS.md` as ADR-013, ADR-014, etc. before implementing.

One thing to note for Phase 3 planning: the config format choice in Phase 2 was **JSON-first** (with .mjs/.js fallback). Original plan mentioned `.ts`, but that adds a loader shim dep. If a user ever needs typed config with intellisense, we can add `.ts` support later via a shim. Not blocking.

## Known blockers / risks

- **API key**: local dev has `ANTHROPIC_API_KEY` set in `.env` (gitignored, set 2026-04-29). CI has no key — Phase 3 integration tests must mock the SDK; manual smoke-tests against real Managed Agents are local-only.
- **GitHub PAT for repo mounting.** Users of v2 will need a GitHub PAT with repo scope. Not a blocker for the code but affects local manual testing.
- **Cost of v2 runs is non-trivial** ($30-80 per full project). Need cost guardrails (max iters, max $ cap) before public launch. Schema already has `costCapUsd` field — enforcement lands in Phase 3 or 7.
- **Managed Agents is beta** (header `managed-agents-2026-04-01`). API shape could shift — pin beta header version and watch changelog.

## Open questions for the user (none right now)

When questions arise, add here before implementing so humans can weigh in.
