# /product-maker:build-product

Build a complete product from idea to deployment in an autonomous loop.

## Usage

```bash
/product-maker:build-product "<product description>" --max-iterations <N> --completion-promise "<completion text>" [OPTIONS]
```

## Parameters

- `product description`: Detailed description of the product you want to build
- `--max-iterations`: Maximum number of iterations (default: 100)
- `--completion-promise`: Text that signals completion (e.g., "PRODUCT_DEPLOYED")
- `--enable-reflection`: (Optional) Enable iteration logging and checkpoint validation for large projects
- `--checkpoint-interval`: (Optional) Run full validation every N iterations (default: 10, requires --enable-reflection)
- `--with-tester`: (Optional) Enable QA tester mode (default: enabled)
- `--no-tester`: (Optional) Disable QA tester mode
- `--test-every`: (Optional) Run tester every N iterations (default: 2)

## Examples

### Basic Usage (With QA Tester - Default)
```bash
/product-maker:build-product "Build a REST API with Express and MongoDB for user management" --max-iterations 50 --completion-promise "API_DEPLOYED"
```

### Without QA Tester (Original Behavior)
```bash
/product-maker:build-product "Build a simple landing page" --max-iterations 30 --completion-promise "DEPLOYED" --no-tester
```

### With Reflection Mode (Large Projects)
```bash
/product-maker:build-product "Build a SaaS dashboard for managing AI automation projects with user auth, project management, and billing integration" --max-iterations 150 --completion-promise "PRODUCTION_READY" --enable-reflection
```

### Custom Test Frequency
```bash
/product-maker:build-product "Build a REST API with auth" --max-iterations 60 --completion-promise "API_LIVE" --test-every 3
```

## How It Works

1. **Phase 1: Planning** - Creates detailed PRD and technical architecture
2. **Phase 2: Foundation** - Sets up project structure, dependencies, and database
3. **Phase 3: Core Features** - Implements main functionality iteratively
4. **Phase 4: Integration** - Connects all systems and APIs
5. **Phase 5: Testing** - Runs tests and fixes bugs
6. **Phase 6: Deployment** - Prepares and deploys to production

The plugin will:
- Work on the product iteratively
- Alternate between BUILDER and TESTER roles (when tester enabled)
- Attempt to exit when done
- Stop hook blocks exit and feeds the prompt back
- Repeat until completion promise is met or max iterations reached
- Block completion if critical bugs are open (when tester enabled)

## QA Tester Mode (NEW)

When QA Tester is enabled (default), iterations alternate between two roles:

### Builder Iterations (odd iterations)
- Reads TESTLOG.md to see bugs from last test sweep
- Fixes all CRITICAL bugs first, then MEDIUM bugs
- Marks fixed bugs in TESTLOG.md with commit hash
- Continues building features from the PRD

### Tester Iterations (every N iterations, default: 2)
- Does NOT build or fix anything
- Runs all tests
- Tries to break every feature with edge cases
- Documents ALL findings in TESTLOG.md
- Commits TESTLOG.md with bug counts

### Safety Feature
The loop will NOT complete even if the completion promise is found, if there are critical bugs open. This ensures quality before shipping.

### TESTLOG.md Format
```markdown
## Test Sweep - Iteration {N} - {timestamp}

### CRITICAL (bloqueantes)
- [BUG-001] Description
  - Steps to reproduce: ...
  - Expected: ...
  - Actual: ...
  - File: path/to/file.ts:line

### MEDIUM (deben arreglarse)
- [BUG-002] Description

### LOW (nice to fix)
- [BUG-003] Description

### PASSED
- List of what works correctly

### Coverage
- Tests executed: X
- Tests passing: Y
- Tests failing: Z
- Coverage estimated: N%
```

## Reflection Mode

When `--enable-reflection` is enabled, the plugin creates a hybrid reflection system:

### Normal Iterations
- Claude reads `ITERATION-LOG.md` to see previous progress
- Works on the next logical task
- Updates the log with changes made and test results
- Minimal overhead, token-efficient

### Checkpoint Iterations (every N iterations)
- Claude performs **full system validation**
- Runs ALL tests, not just related ones
- Reviews code for security, performance, and quality issues
- Creates detailed `CHECKPOINT-REPORT.md`
- Sets priorities for next checkpoint interval

### When to Use Reflection Mode

| Project Type | Iterations | Reflection | Tester | Test Every |
|--------------|------------|------------|--------|------------|
| Simple API | 30-50 | No | Yes | 2 |
| Medium SaaS | 80-120 | Optional | Yes | 2-3 |
| Large Platform | 150-250 | **Yes** | Yes | 2 |
| Migration (100+ files) | 150+ | **Yes** | Yes | 3-4 |

### Files Created

- `ITERATION-LOG.md` - Running log of each iteration's progress
- `CHECKPOINT-REPORT.md` - Full validation reports at checkpoint intervals
- `TESTLOG.md` - QA tester findings (when tester enabled)

## Best Practices

**Write Specific Prompts:**

Bad: "Build a cool web app"

Good:
```
Build a debt collection automation platform with:
- WhatsApp integration for automated messages
- Call center dashboard with real-time metrics
- Payment tracking and reconciliation
- Manager approval workflow
- Multi-tenant architecture
Output <promise>PRODUCTION_READY</promise> when:
- All features working
- Tests passing (>80% coverage)
- Deployed to staging
- Documentation complete
```

**Include Success Criteria:**
- All features implemented
- Tests passing
- Documentation complete
- Deployed to environment
- Performance benchmarks met

**Break Down Large Products:**
```bash
# Phase 1: Core API
/product-maker:build-product "Phase 1: Build REST API..." --max-iterations 50

# Phase 2: Frontend
/product-maker:build-product "Phase 2: Build React dashboard..." --max-iterations 50

# Phase 3: Integrations
/product-maker:build-product "Phase 3: Connect external APIs..." --max-iterations 30
```

## Safety Features

- **Max Iterations Limit**: Prevents infinite loops
- **Completion Promise**: Exact string match to exit
- **Session State**: Preserves progress across iterations
- **Git Integration**: Auto-commits progress
- **Error Recovery**: Continues after failures
- **Critical Bug Block**: Won't complete with critical bugs open (tester mode)

## When to Use

Perfect for:
- Building MVPs overnight
- Migrating entire codebases
- Implementing feature sets
- Creating complete products
- Automating repetitive dev work

Use `--enable-reflection` for:
- Projects with 50+ files
- Projects requiring 100+ iterations
- Complex integrations that need validation
- Migrations where progress tracking is critical

Use `--no-tester` for:
- Quick prototypes where quality is less critical
- Experimentation and learning projects
- When you want maximum building speed

Not ideal for:
- Quick one-off tasks
- Tasks requiring human judgment
- Debugging specific bugs
- Code review

## Monitoring Progress

Check iteration count and recent commits:
```bash
git log --oneline -10
```

View current state file:
```bash
cat .product-maker-state.yaml
```

Check QA status:
```bash
/product-maker:test-status
```

## Canceling

```bash
/product-maker:cancel
```

This removes the state file and stops the loop on next iteration.
