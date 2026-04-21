# Status — live working state

> This file is short on purpose. Keep it updated as work progresses. Detailed plan is in `ROADMAP.md`.

**Last updated**: 2026-04-21
**Current branch**: `claude/read-understand-repo-r0JSG`
**Current phase**: Phase 1 — Monorepo transformation ✅ **DONE**. Next up: Phase 2 — Engine MVP.

---

## Where we are

Phases 0 and 1 both complete. The repo now has:

- Full onboarding + design docs in `CLAUDE.md` + `.claude/`
- pnpm monorepo with three workspace packages:
  - `packages/engine/` — `@spicy/product-maker` (TS, real code lands in Phase 2)
  - `packages/skills-library/` — `@spicy/skills-library` (authored in Phases 4-5)
  - `packages/plugin/` — `@spicy/product-maker-plugin` (filled in Phase 6)
- Root `tsconfig.base.json` + `tsconfig.json` with project references
- `pnpm install`, `pnpm build`, `pnpm typecheck` all pass
- v1 bash plugin **untouched at root** — see ADR-012 for the rationale

## Next action

**Start Phase 2**: Engine MVP — local CLI scaffolding, no API calls yet. See `ROADMAP.md` Phase 2.

Concretely, the next Claude session should:

1. Read this file, then `ROADMAP.md` Phase 2
2. In `packages/engine/`, add deps: `@anthropic-ai/sdk`, `zod`, `commander` (or `citty`), `chalk`, `ora`, `execa`
3. Add dev deps: `vitest`, `tsup`, `@types/node` (already present at root)
4. Build `src/cli.ts`, `src/config.ts`, `src/state.ts`, `src/logger.ts`
5. Scaffold commands: `init`, `build` (stub), `status`, `watch` (stub), `cancel` (stub)
6. Add `bin/product-maker.mjs` shebang entry
7. Write at least one Vitest happy-path test per command
8. Commit + push

Do NOT touch Managed Agents yet. Phase 3 is where the real API wiring happens.

## Recent changes (reverse chronological)

- **2026-04-21** — Phase 1 complete: monorepo scaffolding + project references + v2 banner on README + ADR-012. This session.
- **2026-04-21** — Foundation docs created (Phase 0). v1 preserved on branch `v1-legacy`.
- **2026-04-21** — Design session: resolved v2 architecture. See `DECISIONS.md` for all 12 ADRs captured.
- **Pre-2026-04-21** — v1.1.0 shipped: integrated QA Tester mode with builder/tester alternation (commit `6dbb17b`). See v1 code in `scripts/` and `commands/`.

## Pending decisions

None currently. All 12 v2 design decisions are resolved and documented in `DECISIONS.md`.

**Future sessions may encounter new decisions.** If so, document them in `DECISIONS.md` as ADR-013, ADR-014, etc. before implementing.

## Known blockers / risks

- **No Anthropic API key available in this repo yet.** v2 requires `ANTHROPIC_API_KEY` set in user env. Not a blocker for Phase 2 (local scaffolding, no API calls) but becomes relevant in Phase 3.
- **GitHub PAT for repo mounting.** Users of v2 will need a GitHub PAT with repo scope. Not a blocker for building the engine, but affects UX docs.
- **Cost of v2 runs is non-trivial** ($30-80 per full project). Need cost guardrails (max iters, max $ cap) before public launch.
- **Managed Agents is beta** (header `managed-agents-2026-04-01`). API shape could shift — pin beta header version and watch changelog.

## Open questions for the user (none right now)

When questions arise, add here before implementing so humans can weigh in.
