# Status — live working state

> This file is short on purpose. Keep it updated as work progresses. Detailed plan is in `ROADMAP.md`.

**Last updated**: 2026-04-21
**Current branch**: `claude/read-understand-repo-r0JSG`
**Current phase**: Phase 0 — Foundation docs

---

## Where we are

Phase 0 is **complete when this document, plus `CLAUDE.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `settings.json`, and the monorepo skeleton (`package.json` + `pnpm-workspace.yaml`) are committed and pushed.**

The v1 bash-based plugin is fully preserved:
- All v1 files untouched on `main` and `claude/read-understand-repo-r0JSG`
- Branch `v1-legacy` created as an explicit backup pointing at the last v1 commit

## Next action

**Start Phase 1**: monorepo transformation (see `ROADMAP.md` Phase 1).

Concretely, the next Claude session should:

1. Read this file, then `ROADMAP.md` Phase 1
2. Create `packages/engine/`, `packages/skills-library/`, `packages/plugin/` skeletons with individual `package.json` in each
3. Move v1 files into a `v1/` subfolder at root (or leave in place — see Phase 1 decision point)
4. Initialize TypeScript config (`tsconfig.json` at root + per-package)
5. Commit + push

Do NOT start writing engine code yet. Phase 1 is pure scaffolding. Phase 2 is engine MVP.

## Recent changes (reverse chronological)

- **2026-04-21** — Foundation docs created (Phase 0). v1 preserved on branch `v1-legacy`. This session.
- **2026-04-21** — Design session: resolved v2 architecture. See `DECISIONS.md` for all 11 ADRs captured.
- **Pre-2026-04-21** — v1.1.0 shipped: integrated QA Tester mode with builder/tester alternation (commit `6dbb17b`). See v1 code in `scripts/` and `commands/`.

## Pending decisions

None currently. All 11 v2 design decisions are resolved and documented in `DECISIONS.md`.

**Future sessions may encounter new decisions.** If so, document them in `DECISIONS.md` as ADR-012, ADR-013, etc. before implementing.

## Known blockers / risks

- **No Anthropic API key available in this repo yet.** v2 requires `ANTHROPIC_API_KEY` set in user env. Not a blocker for Phase 1 (scaffolding) but becomes relevant in Phase 2+.
- **GitHub PAT for repo mounting.** Users of v2 will need a GitHub PAT with repo scope. Not a blocker for building the engine, but affects UX docs.
- **Cost of v2 runs is non-trivial** ($30-80 per full project). Need cost guardrails (max iters, max $ cap) before public launch.
- **Managed Agents is beta** (header `managed-agents-2026-04-01`). API shape could shift — pin beta header version and watch changelog.

## Open questions for the user (none right now)

When questions arise, add here before implementing so humans can weigh in.
