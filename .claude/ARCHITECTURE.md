# Architecture — v2 design in depth

This document captures the **v2 architecture** (TypeScript + Managed Agents). For v1 (bash) architecture, read `scripts/stop-hook.sh` — it's heavily commented and tells the whole story.

> If something here conflicts with `DECISIONS.md`, trust `DECISIONS.md` — it's the authoritative log of what was chosen and why.

---

## 10,000-foot view

```
┌──────────────────────────────────────────────────────────────────────────┐
│  USER'S MACHINE (laptop)                                                  │
│                                                                           │
│   Claude Code                     OR                  Terminal            │
│   /pm:build                                           $ product-maker build│
│        │                                                   │              │
│        └──────────── exec ────────────┬───────────────────┘              │
│                                        │                                  │
│                                        ▼                                  │
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │  Engine CLI (node process, thin)                                │    │
│   │  - Reads .product-maker/state.json                              │    │
│   │  - Opens SSE stream to Orchestrator session                     │    │
│   │  - Routes custom_tool_use events → spawn sub-sessions           │    │
│   │  - Writes .product-maker/logs/stream.log                        │    │
│   │  - Exits when session.status_terminated (laptop can sleep)      │    │
│   └─────────────────────────────────────────────────────────────────┘    │
│                                        │                                  │
└────────────────────────────────────────┼──────────────────────────────────┘
                                         │ HTTPS (Anthropic API)
                                         │ beta: managed-agents-2026-04-01
                                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ANTHROPIC INFRASTRUCTURE                                                 │
│                                                                           │
│   ┌───────────────────────────────────────────────────────────────┐     │
│   │  Orchestration layer (agent loop runs here)                    │     │
│   │                                                                 │     │
│   │   ORCHESTRATOR (Opus 4.7, adaptive thinking, xhigh effort)    │     │
│   │   Persistent long-lived session (hours to days).              │     │
│   │   Tools: read, grep, glob, bash, write, spawn_executor,       │     │
│   │          spawn_tester.                                         │     │
│   │                                                                │     │
│   │   When Orchestrator calls spawn_executor(task):                │     │
│   │     → agent.custom_tool_use event on Orchestrator's stream    │     │
│   │     → Engine CLI intercepts, creates NEW session for          │     │
│   │       Executor agent, waits for it to finish                  │     │
│   │     → Engine sends user.custom_tool_result back to            │     │
│   │       Orchestrator (summary + commit SHA)                     │     │
│   │     → Orchestrator resumes                                    │     │
│   └───────────────────────────────────────────────────────────────┘     │
│                                        │                                  │
│                                        ▼                                  │
│   ┌──────────────────────┐      ┌─────────────────────────────────┐     │
│   │ EXECUTOR SESSION     │      │ TESTER SESSION                   │     │
│   │ (Sonnet 4.6, medium) │      │ (Opus 4.7, high + playwright)   │     │
│   │                      │      │                                  │     │
│   │ Container mounts the │      │ Container mounts the GH repo.   │     │
│   │ user's GH repo.      │      │ Runs npm run dev, Playwright    │     │
│   │ Full toolset: bash,  │      │ captures screenshots, Opus 4.7  │     │
│   │ read, write, edit,   │      │ analyzes visually via vision.   │     │
│   │ glob, grep, web.     │      │ Writes findings to TESTLOG.md.  │     │
│   │ Commits + pushes.    │      │ Commits TESTLOG.md.             │     │
│   └──────────────────────┘      └─────────────────────────────────┘     │
│                │                               │                          │
│                └──────── both mount ───────────┘                          │
│                                │                                          │
└────────────────────────────────┼──────────────────────────────────────────┘
                                 │ github_repository resource (PAT-authed)
                                 │
                                 ▼
                     ┌──────────────────────────┐
                     │ GitHub — user's repo     │
                     │ (source of truth for     │
                     │  all code + CLAUDE.md +  │
                     │  TESTLOG.md + state)     │
                     └──────────────────────────┘
```

---

## The three artifacts (v2 codebase)

| Artifact | Path in this repo | Purpose |
|---|---|---|
| **Engine** | `packages/engine/` | npm package. The CLI. Source of truth for orchestration logic. Depends on `@anthropic-ai/sdk`. |
| **Skills library** | `packages/skills-library/` | Reusable stack skills (Next.js+Supabase, visual-qa, etc.). Copied into user projects via `product-maker add-skill`. Published as a separate npm package or consumed via git. |
| **Plugin** | `packages/plugin/` | Thin Claude Code plugin. Just slash commands that `exec` the engine CLI via Bash tool. No business logic. |

**These three are independent and versioned separately.** The plugin can lag behind the engine (older plugin still works with newer engine).

---

## Per-user-project structure (what the engine creates)

When a user runs `product-maker init`, this is what ends up in their repo:

```
my-saas-app/                          ← user's product repo
├── CLAUDE.md                         ← product spec + memory (human writes idea, Orchestrator updates)
├── TESTLOG.md                        ← QA findings (Tester auto-manages, severity-tagged, append-only)
├── product-maker.config.ts           ← user-editable config (completion promise, max iters, flags)
├── .product-maker/
│   ├── state.json                    ← { agent_ids, env_id, current_session_id, iter, ... }
│   ├── plans/iter-N.md               ← Orchestrator writes plan here before spawn_executor
│   ├── logs/stream.log               ← all SSE events, JSONL
│   ├── reports/completion.md         ← filled at end of run
│   └── scripts/
│       └── capture-screenshots.mjs   ← copied from visual-qa skill
├── skills/                           ← stack knowledge (subset copied from skills-library)
│   ├── nextjs-supabase/
│   │   ├── SKILL.md
│   │   └── ...
│   ├── visual-qa/
│   │   └── SKILL.md
│   └── project-conventions/          ← optional custom skill the user writes
├── src/                              ← THE ACTUAL PRODUCT being built
├── package.json                      ← user's product's package.json
├── .gitignore
└── ... etc
```

**Note**: `CLAUDE.md` in the user's repo is **different** from the `CLAUDE.md` in this repo. Same filename, different purpose:
- This repo's `CLAUDE.md` = onboarding for Claude sessions working on the engine itself
- User repo's `CLAUDE.md` = product spec + Orchestrator memory for the product being built

---

## The three agents in depth

### Orchestrator (Opus 4.7)

**Role**: the brain. Reads CLAUDE.md, understands current state of the project, decides the next action, delegates via custom tools.

**Lifetime**: one session per build run. Long-lived (hours to days for a full project). Context grows but compaction handles it.

**System prompt (template, see `packages/engine/src/agents/orchestrator.ts` when implemented)**:
```
You are the Orchestrator for Product Maker.

Your job: read CLAUDE.md, understand what the user is building and what's
already done, decide the next highest-value task, delegate execution via
tools, integrate results into CLAUDE.md, and repeat until the completion
promise is met.

Principles:
- Always read CLAUDE.md first when starting a new iteration.
- Write a short plan to .product-maker/plans/iter-N.md before calling spawn_executor.
- Delegate tactical work (writing code, running tests) — don't do it yourself.
- Call spawn_tester only when there's something testable (avoid trivial reviews).
- If the Tester reports CRITICAL bugs, the next Executor task must fix them before new features.
- Update CLAUDE.md at the end of each iteration with: what was done, what's next, any open questions.
- When the completion promise is met AND no CRITICAL bugs open, write .product-maker/reports/completion.md and stop.

Budget: {max_iterations} iterations. {cost_cap_reminder}.

Tools available:
- read, grep, glob, bash (read-only): explore the repo
- write: edit CLAUDE.md, TESTLOG.md, plans/*
- spawn_executor(task_description, context): delegates to Executor
- spawn_tester(focus, visual: boolean): delegates to Tester

You are autonomous. Do not ask the user questions. Make the call.
```

**Tools** (set via `agents.create()`):
- `agent_toolset_20260401` with read/grep/glob/bash/write enabled (edit/web_fetch/web_search disabled — no mutation to user code, no external fetches)
- Custom tool: `spawn_executor(task_description: string, context: string)` — input schema TBD
- Custom tool: `spawn_tester(focus: string, visual: boolean)` — input schema TBD

**Resources** (set on the session at `sessions.create()`):
- `github_repository` — the user's product repo, with PAT from env

### Executor (Sonnet 4.6)

**Role**: the hands. Receives a specific task description, implements it, commits, pushes.

**Lifetime**: one session per task spawned. Short-lived (seconds to minutes).

**System prompt**:
```
You are the Executor for Product Maker.

You receive a specific task from the Orchestrator. Execute it:
1. Read the task carefully.
2. Read relevant files in the repo to understand current state.
3. Make the changes. Keep the diff minimal and focused.
4. Commit with a descriptive message.
5. Push to the current branch.
6. Return a JSON summary of what you did (files changed, commit SHA, any issues).

Constraints:
- Do not introduce scope creep. If the task says "add email field", don't
  also add phone and address fields.
- Do not skip tests. If tests exist, run them. If they fail, fix them (or
  explicitly report the failure).
- Use the project's existing conventions. Check neighboring files.
- Stack-specific knowledge comes from the attached skills.
```

**Tools**: full `agent_toolset_20260401` (bash, read, write, edit, glob, grep, web_fetch, web_search).

**Resources**: same GitHub repo.

**Skills attached**: the stack-specific skills from the user's `skills/` folder (uploaded to Skills API at `init` time).

### Tester (Opus 4.7)

**Role**: the critic. Runs the app, tests it functionally + optionally visually, logs findings.

**Lifetime**: one session per review. Short-to-medium (minutes).

**System prompt**:
```
You are the Tester for Product Maker.

Your job: find what's broken, inconsistent, or ugly. You are ruthless but
specific.

Process:
1. Read CLAUDE.md to understand what the app should do.
2. Start the dev server if needed (bash: npm run dev &).
3. Run automated tests if any exist.
4. If visual QA is requested: run the screenshot capture script. Read each
   screenshot and analyze layout, alignment, overflow, responsiveness.
5. Append findings to TESTLOG.md with format:
   ## BUG-NNN: <short title> [CRITICAL|MEDIUM|LOW]
   - Steps to reproduce: ...
   - Expected: ...
   - Actual: ...
   - Evidence: <file:line OR screenshot path>
6. Commit TESTLOG.md.
7. Return a JSON summary: {critical: N, medium: N, low: N, total: N}.

Severity guidelines:
- CRITICAL: breaks core flow, security issue, data loss, prevents build/deploy.
- MEDIUM: feature works but has obvious UX issues (wrong copy, bad layout).
- LOW: nits, minor styling, improvements.

Do not invent bugs. If everything works, the TESTLOG entry for this run
says "No issues found in scope: <focus>". That's valid.
```

**Tools**: full `agent_toolset_20260401` + optional Playwright via bash.

**Skills attached**: `visual-qa` skill + stack skills.

---

## Event flow — one iteration in detail

```
t=0:    User runs `product-maker build`
t=0.1:  Engine reads state.json (has agent_ids from init)
t=0.2:  Engine creates new Orchestrator session
           POST /v1/sessions
           body: { agent: ORCH_AGENT_ID, environment_id: ENV_ID,
                   resources: [{type: "github_repository", url, token, ...}] }
        Session is in `rescheduling` then `running` status
t=0.5:  Engine opens SSE stream:
           GET /v1/sessions/{id}/events/stream
t=0.6:  Engine sends kickoff:
           POST /v1/sessions/{id}/events
           body: { events: [{type: "user.message",
                   content: [{type: "text", text: "Read CLAUDE.md and proceed."}]}] }

t=1-3:  Orchestrator reads CLAUDE.md, TESTLOG.md, explores repo.
        Engine sees agent.tool_use events for read/grep/glob.

t=5:    Orchestrator writes plan to .product-maker/plans/iter-N.md.
        Engine sees agent.tool_use for write.

t=6:    Orchestrator calls spawn_executor(task, context).
        Engine sees `agent.custom_tool_use` event.
        Session goes idle waiting for user.custom_tool_result.

t=6.1:  Engine creates Executor session:
           POST /v1/sessions
           body: { agent: EXECUTOR_AGENT_ID, environment_id: ENV_ID,
                   resources: [same GH repo] }
t=6.2:  Engine opens Executor stream.
t=6.3:  Engine sends kickoff with task_description from spawn_executor.

t=7-20: Executor implements task. Edits files via edit tool. Runs bash
        for tests. Commits. Pushes via git.

t=21:   Executor ends (agent.message with "done", session.status_idle
        with stop_reason.type === "end_turn").
t=21.5: Engine collects summary from Executor's final message.
t=22:   Engine sends user.custom_tool_result to Orchestrator session:
           body: { events: [{type: "user.custom_tool_result",
                   custom_tool_use_id: <orig_event_id>,
                   content: [{type: "text", text: "<summary + SHA>"}]}] }
t=22.1: Orchestrator resumes (session.status_running).

t=25:   Orchestrator decides next step. Maybe spawn_tester(focus, visual=true).
        [same pattern repeats]

...

t=HOURS: Orchestrator determines completion promise met, no CRITICAL bugs.
         Writes completion.md. Agent stops sending new events.
         Session status: idle with stop_reason.type === "end_turn" (terminal).

Engine's stream consumer breaks on terminal idle, calls sessions.archive(),
writes final state.json, exits.
```

### Critical implementation notes

These are the rakes the `claude-api` skill warns about. Do not skip any:

1. **Stream-first ordering**. Open the SSE stream *before* sending the kickoff `user.message`. Otherwise early events arrive buffered in one batch.
2. **Lossless reconnect**. If the SSE connection drops, on reconnect: open the new stream, then fetch `sessions.events.list()` for history, dedupe by event ID as the stream catches up.
3. **Correct idle-break gate**. `session.status_idle` alone is NOT terminal. It can mean "waiting on user.custom_tool_result" or "waiting on tool confirmation". Break only on:
   - `session.status_terminated`, OR
   - `session.status_idle` with `stop_reason.type in {"end_turn", "retries_exhausted"}`
   Do NOT break on `stop_reason.type === "requires_action"` — that means waiting on you.
4. **Post-idle race**. After `session.status_idle`, the queryable session status has a ~1s lag before reflecting idle. If you immediately call `sessions.archive()`, it can 400. Poll briefly or wait.
5. **Custom tool result shape**. Must include `custom_tool_use_id` matching the triggering event's ID (not a `toolu_` ID).
6. **Agent reference in session.create**: use string shorthand `agent: "agent_abc123"` (latest version) OR object `{type: "agent", id, version}`. Inline `model`/`system`/`tools` on session = 400.

See the `claude-api` skill's `shared/managed-agents-client-patterns.md` for full patterns with code.

---

## State file schema (`.product-maker/state.json`)

```typescript
type State = {
  version: "2.0";
  createdAt: string;                     // ISO 8601
  lastUpdatedAt: string;

  // Persistent resources (created at `init`, reused across builds)
  environmentId: string;                 // env_...
  orchestratorAgentId: string;           // agent_...
  executorAgentId: string;
  testerAgentId: string;

  // Current run
  currentSessionId: string | null;       // sesn_... or null if not running
  iterationCount: number;
  status: "idle" | "running" | "completed" | "cancelled" | "failed";

  // Config snapshot (from product-maker.config.ts at last build)
  completionPromise: string;             // e.g., "DEPLOYED"
  maxIterations: number;
  costCapUsd: number | null;

  // Run history
  runs: Array<{
    sessionId: string;
    startedAt: string;
    endedAt: string | null;
    terminalReason: "completed" | "cancelled" | "failed" | "unknown";
    costUsd: number | null;              // extracted from usage events
  }>;

  // Bug state snapshot (derived from TESTLOG.md)
  bugs: {
    critical: number;
    medium: number;
    low: number;
  };
};
```

---

## Cost model

Approximate spend per full product (100-iter, 4-6 hours wall time):

| Line item | Typical | Notes |
|---|---|---|
| Orchestrator (Opus 4.7, xhigh effort) | $15-40 | Runs the whole time; compaction helps |
| Executor (Sonnet 4.6, medium) | $5-15 | ~50 spawns × ~$0.25 each |
| Tester functional (Opus 4.7, high) | $3-10 | ~20 spawns × ~$0.50 each |
| Tester visual (Opus 4.7 + screenshots) | $5-20 | ~10 spawns × ~$2 each (images + vision) |
| **Total per full project** | **$30-85** | |

Prompt caching reduces this ~30-50% once the project's skills + CLAUDE.md + repo context are cached.

**Cost controls** (implement in engine):
- Max iterations cap
- Max $ cap (hard stop when usage events cross threshold)
- `--visual-qa-every N` (default 5) to throttle the most expensive sub-session
- Per-session `task_budget` (beta, Opus 4.7) — tells the model "you have N tokens for this turn", it self-moderates

---

## Observability

The CLI is the primary observability surface. No dashboard in v1.

- **Stream log**: all SSE events written to `.product-maker/logs/stream.log` as JSONL. One line per event. Can be tailed or parsed later.
- **Status command**: reads state.json + parses last chunk of stream.log → compact summary (iter N/M, last action, open bugs, cost so far).
- **Completion report**: at end of run, engine writes `.product-maker/reports/completion.md` with total iters, cost, bugs fixed, final state.
- **Git as audit log**: every action ends with a commit. `git log` on the user's repo is the human-readable history of the run.

---

## What happens when things go wrong

- **Orchestrator session crashes mid-run**: state.json has the `currentSessionId`. On next `product-maker build`, engine detects orphan session, sends `user.interrupt`, archives it, creates a fresh Orchestrator session (the agent config is the same, new session continues from CLAUDE.md state).
- **Executor fails to commit**: Executor's summary reports failure. Orchestrator sees it in `user.custom_tool_result`, decides to retry with different approach or mark task as blocked.
- **Tester finds CRITICAL bugs**: recorded in TESTLOG.md. Orchestrator's system prompt requires addressing CRITICAL before new features.
- **Cost cap hit**: engine detects via `span.model_request_end` event's `model_usage`, sends `user.interrupt`, marks status as "cancelled — cost cap", writes report.
- **Repo push conflict**: Executor's git push fails. Executor's summary reports. Orchestrator instructs next Executor to pull + rebase + retry.

---

## What's NOT in v2 (explicit non-goals for first release)

- **Deployment**: `--deploy-to vercel` is future work. v2.0 builds + tests. User deploys manually.
- **Multi-repo projects**: v2.0 supports one repo per product. Microservices across repos later.
- **Non-GitHub hosts**: GitLab, Bitbucket later. GitHub only in v2.0.
- **UI dashboard**: CLI only. Web dashboard is community project territory.
- **Human-in-the-loop checkpoints**: fully autonomous per ADR-010. Semi-autonomous mode is v3.

Items here should be revisited after Phase 7 (dogfooding) tells us what's actually valuable.
