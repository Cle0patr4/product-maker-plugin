# Architectural Decisions (ADR log)

> Each decision captured during the v2 design session. Format: ADR-NNN, status, context, decision, consequences, alternatives.
>
> Add new ADRs as ADR-012, ADR-013, etc. Never rewrite history — supersede with a new ADR instead.

---

## ADR-001: Multi-agent orchestration instead of Ralph Wiggum

**Status**: Accepted (2026-04-21)

**Context**: v1 uses a single Claude instance with the same prompt re-injected every iteration. This "Ralph Wiggum" technique works but has limits: no model specialization, no context isolation between concerns (building vs. testing), no way to use different models for different roles. Long runs accumulate context and the agent gets confused.

**Decision**: v2 uses multiple specialized agents with distinct roles, distinct system prompts, and distinct models. No re-injection of the same prompt — each agent has its own mandate.

**Consequences**:
- (+) Cheaper: Sonnet for Executor is 3× cheaper than Opus for the bulk of file-edit work.
- (+) Smarter: Opus for planning and visual review where intelligence matters.
- (+) Cleaner context: each sub-agent starts fresh, doesn't inherit the Orchestrator's exploration noise.
- (-) More moving parts: 3 agents, 3 sessions, handoffs to design.
- (-) Communication medium must be explicit (chose CLAUDE.md + custom tools).

**Alternatives considered**:
- Single Claude with longer context (v1's pattern, bigger budget) — rejected; doesn't solve model specialization.
- Two agents (builder/tester alternation like v1 already does in-process) — rejected; the planning layer was repeatedly conflated with execution and caused drift. See ADR-003.

---

## ADR-002: Managed Agents instead of self-hosted Agent SDK

**Status**: Accepted (2026-04-21)

**Context**: Two surfaces are available for agent building: the Claude API + tool use (you host everything), or Managed Agents (Anthropic hosts the agent loop and per-session container). Product Maker needs long-running sessions, file mounts, persistence across client disconnects, and prompt caching — all first-class in Managed Agents.

**Decision**: Build on Managed Agents. The engine is a thin client that creates agents/sessions and routes events.

**Consequences**:
- (+) User's laptop can close mid-run. Session continues on Anthropic's infra.
- (+) Prompt caching, context compaction, adaptive thinking come for free.
- (+) Built-in container provisioning + file mounts via `github_repository` resource.
- (+) Skills are first-class citizens; can be attached to agents.
- (-) Beta header `managed-agents-2026-04-01` — shape could shift. Pin and watch.
- (-) Not available on Bedrock/Vertex/Foundry. First-party only.
- (-) Per-session containers cost more than running locally. Mitigated by prompt caching.

**Alternatives considered**:
- Self-hosted Agent SDK with local Docker containers — rejected; reinvents what Managed Agents already solves, plus requires user to have Docker.
- Hybrid (orchestrator on Managed Agents, sub-agents self-hosted) — rejected; no payoff, more complexity.

---

## ADR-003: Two sub-agents + persistent Orchestrator (not three)

**Status**: Accepted (2026-04-21)

**Context**: Initial design had three agents: Planner (Opus), Executor (Sonnet), Tester (Opus). User asked: isn't the Planner's role the same as the orchestration logic? Investigation confirmed the Planner was a redundant layer — the Orchestrator (LLM making decisions based on CLAUDE.md) is already the planner.

**Decision**: Two sub-agents: Executor and Tester. The Orchestrator IS the planner. It uses custom tools `spawn_executor` and `spawn_tester` to delegate, intercepted by the engine CLI.

**Consequences**:
- (+) Simpler mental model: one smart agent plans, two focused agents execute.
- (+) Cheaper: no dedicated Planner session per iteration.
- (+) Better prompt caching: Orchestrator's session is long-lived, CLAUDE.md stays cached.
- (+) Orchestrator can skip Tester calls on trivial changes (unique to this design).
- (-) Orchestrator's context grows over time, but compaction handles it.

**Alternatives considered**:
- Three agents (original proposal) — rejected per above.
- Single agent that plans + executes + tests — rejected; no model specialization, loses the "Tester is Opus-tier" upgrade path.

---

## ADR-004: Persistent Orchestrator session (not stateless API calls)

**Status**: Accepted (2026-04-21)

**Context**: The Orchestrator could either be (A) a single Managed Agents session that lives for the whole build, or (B) a series of `messages.create()` API calls where each "iteration" is a fresh request that loads CLAUDE.md.

**Decision**: Option A — one persistent session for the duration of the build.

**Consequences**:
- (+) Prompt caching is optimal — the large CLAUDE.md + skills are cached after first use.
- (+) Agent has in-memory awareness of what just happened (recent tool calls, recent decisions) without re-reading CLAUDE.md every turn.
- (+) Container lifecycle is handled by Anthropic; no provisioning per iteration.
- (+) Native SSE streaming for the whole run.
- (-) If the session dies unexpectedly, recovery is more involved (but CLAUDE.md is the fallback — we can restart the Orchestrator and it reads state from CLAUDE.md).
- (-) Can't easily pause/resume across laptop reboots beyond Anthropic's session lifecycle.

**Alternatives considered**:
- Option B (stateless) — rejected; gives up prompt caching and requires re-building context every iteration.

---

## ADR-005: CLI-first, plugin as thin wrapper

**Status**: Accepted (2026-04-21)

**Context**: User asked plugin vs CLI vs both. Because the real work runs in Anthropic's cloud (not in Claude Code), the plugin is always secondary to the CLI.

**Decision**: Engine is an npm package (`@spicy/product-maker`) consumed via `npx` or global install. The plugin is a thin wrapper: slash commands that `!exec` the CLI. Plugin is optional; CLI works standalone.

**Consequences**:
- (+) Users without Claude Code can use the tool.
- (+) Plugin is minimal code (~5 markdown files).
- (+) One source of truth for business logic (the engine).
- (-) Users must learn a CLI. Mitigated by `init` command scaffolding everything.

**Alternatives considered**:
- Plugin-only — rejected; forces Claude Code dependency.
- MCP server packaged with plugin — rejected; over-engineered for v1, interesting for v2 if we want richer slash-command UX.

**Important constraint from this decision**: the plugin MUST NOT pipe the full SSE stream into Claude Code's conversation context. Doing so would add tens of thousands of input tokens to every subsequent message in that Claude Code session. Instead, the plugin tells the user where to find the log file (or opens a `/pm:tail` that shows last N events).

---

## ADR-006: TypeScript over Python for the engine

**Status**: Accepted (2026-04-21)

**Context**: Both Python and TypeScript SDKs fully support Managed Agents. Choice came down to ecosystem fit.

**Decision**: TypeScript. Node 20+. ESM. pnpm workspaces.

**Consequences**:
- (+) Cleaner bindings for Managed Agents in TS (typed event unions, Zod for tool schemas).
- (+) Playwright is more idiomatic in TS for the visual-qa skill.
- (+) npm/pnpm publishing story is simpler than Python packaging.
- (+) `create-product-maker` CLI follows the `create-next-app` / `create-vite` pattern users know.
- (-) Users who prefer Python contribute more friction. Not a blocker — engine is invoked via CLI.

**Alternatives considered**:
- Python — rejected per above; no killer advantage.
- Polyglot (orchestrator in one language, tools in another) — rejected; over-engineered.

---

## ADR-007: Skills for stack knowledge (not hardcoded)

**Status**: Accepted (2026-04-21)

**Context**: Different products use different stacks (Next.js+Supabase vs FastAPI+Postgres vs Rust CLI). Options for per-stack customization: (a) multiple engine versions, (b) config-driven, (c) Skills.

**Decision**: Stack-specific knowledge lives in Anthropic Skills. The engine is stack-agnostic. Users compose skills per project.

**Consequences**:
- (+) First-class Managed Agents feature — progressive disclosure, pre-compiled, cache-friendly.
- (+) Skills can be contributed by the community in `packages/skills-library/`.
- (+) Users can write custom skills for their own conventions (`project-conventions/SKILL.md`).
- (+) Token-efficient: only the skills relevant to the current task are loaded into full context.
- (-) Users learn a new concept (Skills). Mitigated by `product-maker add-skill <name>` CLI.
- (-) Skills API itself is beta (`skills-2025-10-02`).

**Alternatives considered**:
- Per-project plugin templates — rejected; duplication, upgrades are painful.
- Config-driven stack selection with hardcoded branches — rejected; not extensible to new stacks without engine releases.

---

## ADR-008: GitHub repo as source of truth

**Status**: Accepted (2026-04-21)

**Context**: Managed Agents containers are ephemeral per session. Where does the product code live between sessions?

**Decision**: The user creates a GitHub repo (empty is fine); all sessions mount it via the `github_repository` resource with a PAT (scope `repo`). Executor commits + pushes on every task. Next session clones the repo fresh with the latest state.

**Consequences**:
- (+) Users can inspect the work out-of-band (GitHub UI).
- (+) Git log becomes the audit trail.
- (+) No Anthropic-side persistent workspace dependency.
- (+) Users can stop at any time and keep the progress (it's in GitHub).
- (+) Anthropic's git proxy injects the PAT; the token never enters the container.
- (-) Requires GitHub account + PAT creation. Mitigated by `init` walking the user through it.
- (-) Private repos only (PAT can be misused if leaked). Doc + `.gitignore` hygiene.

**Alternatives considered**:
- Anthropic-hosted persistent workspace (`session.status_idle` + reuse?) — rejected; sessions are disposable by design, not workspaces.
- Upload/download via Files API between sessions — rejected; complex, no history, no external auditability.

---

## ADR-009: Playwright + Opus 4.7 vision for visual QA (not Computer Use)

**Status**: Accepted (2026-04-21)

**Context**: The user specifically wants the Tester to detect visual bugs (layout, alignment, overflow on scroll). Options: (A) Computer Use tool with a hosted desktop, (B) Playwright in the container + Opus 4.7 reading screenshots.

**Decision**: Option B — Playwright/Chromium headless inside the Tester session's container. Opus 4.7's high-res vision (up to 2576px long edge) analyzes the screenshots.

**Consequences**:
- (+) No desktop environment needed. Works in standard Managed Agents container.
- (+) Deterministic scripted flows (Playwright) are cheaper and more reliable than LLM-driven clicks (Computer Use).
- (+) Screenshots are persisted and can be embedded in GitHub issues or PRs.
- (+) Packaged as a reusable `visual-qa` skill — other projects reuse the playbook.
- (-) Requires pre-configured environment with Node + Playwright + Chromium (one-time setup in `init`).
- (-) The Tester must know how to start the dev server, which is stack-specific (comes from the stack skill).

**Alternatives considered**:
- Computer Use — rejected; overkill and more expensive for the narrow task of screenshot-based visual review.
- No visual QA — rejected; user specifically asked for it.

---

## ADR-010: Fully autonomous v1 (no human checkpoints)

**Status**: Accepted (2026-04-21)

**Context**: With autonomous agents, there's a spectrum from fully auto ("decide everything, never ask me") to semi-auto ("pause on big decisions"). User chose fully autonomous for v1.

**Decision**: v1 is fully autonomous. No `AskUserQuestion`-style pauses. The Orchestrator makes all calls. Cost/iteration caps are the only guardrails.

**Consequences**:
- (+) True "sleep while it ships" experience — the whole point of the tool.
- (+) Simpler engine: no need for persistent bidirectional user channel during a run.
- (-) Bad calls are made without human veto. Mitigated by: (a) git history is the rollback path, (b) explicit cost cap, (c) CRITICAL bug blocks exit.
- (-) Drift on long runs if CLAUDE.md is ambiguous. Mitigated by clear completion promise.

**Alternatives considered**:
- Semi-autonomous checkpoint mode — deferred to v3.
- Per-iteration user approval — rejected; defeats the purpose.

---

## ADR-011: Transform the existing repo (not fresh start)

**Status**: Accepted (2026-04-21)

**Context**: With v2 being a complete rewrite (bash → TS, single-loop → multi-agent, local → cloud), it could go in a brand new repo OR replace v1 in this repo.

**Decision**: Transform this repo. Create a `v1-legacy` branch pinned at the current commit. Keep v1 files at repo root until v2 is functionally complete. Then v2.0 major release removes v1 and becomes the new `main`.

**Consequences**:
- (+) Continuity for existing v1 users — same repo URL, npm name, installed plugins keep working.
- (+) Issues + history + stars are preserved.
- (+) Git log tells the full evolution story.
- (-) Repo is "two projects at once" during transition. Documented in CLAUDE.md glossary.
- (-) `pnpm install` at root doesn't affect v1 scripts; must be careful not to break v1 paths.

**Alternatives considered**:
- Fresh repo `@spicy/product-maker` — rejected; loses continuity and v1 users would be stranded.
- Monorepo from day one with v1 moved to `v1/` subfolder — deferred; decide in Phase 1.

---

## Template for new ADRs

```markdown
## ADR-NNN: <short decision title>

**Status**: Proposed | Accepted | Superseded by ADR-NNN (YYYY-MM-DD)

**Context**: Why was this decision needed? What was the ambiguity?

**Decision**: What was chosen, stated crisply.

**Consequences**:
- (+) Positive consequence
- (+) Positive consequence
- (-) Negative consequence or constraint introduced

**Alternatives considered**:
- Alternative A — why rejected.
- Alternative B — why rejected.
```

Add new ADRs at the bottom, never rewrite past ones.
