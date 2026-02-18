# Product Maker Plugin for Claude Code

**Ship complete, tested products while you sleep**

An autonomous development loop plugin that transforms ideas into deployed products through iterative AI-driven development. Based on the Ralph Wiggum technique but optimized specifically for building complete applications from scratch.

## What's New in v1.1.0

**Integrated QA Tester** - The plugin now alternates between BUILDER and TESTER roles, automatically finding and fixing bugs before completion.

## Overview

Product Maker is a Claude Code plugin that creates a self-referential feedback loop where Claude works continuously on your product until it's complete, tested, and deployed. You write the prompt once, and the plugin handles the iterative development process automatically.

```
You -> Write prompt once
       |
Claude -> Plans architecture
       -> Implements features (BUILDER)
       -> Tests & finds bugs (TESTER)
       -> Fixes bugs (BUILDER)
       -> Runs tests
       -> Deploys
       |
You <- Wake up to a shipped, tested product
```

## How It Works

Product Maker uses a **Stop Hook** that intercepts Claude's exit attempts:

1. You run the command ONCE with your product description
2. Claude works on the product (BUILDER role)
3. Every N iterations, Claude switches to TESTER role
4. TESTER finds bugs and documents them in TESTLOG.md
5. BUILDER fixes bugs before continuing with features
6. Loop continues until completion promise met AND no critical bugs
7. Git commits preserve all progress

## Installation

### Option 1: Via Claude Code Marketplace (Coming Soon)

```bash
/plugin install product-maker@spicy-automations
```

### Option 2: Manual Installation

1. Clone or download this repository
2. Copy the `product-maker-plugin` folder to your Claude Code plugins directory:
   ```bash
   cp -r product-maker-plugin ~/.claude/plugins/product-maker
   ```
3. Make scripts executable:
   ```bash
   chmod +x ~/.claude/plugins/product-maker/scripts/*.sh
   ```
4. Reload Claude Code or restart your session

## Quick Start

### Basic Usage (With QA Tester)

```bash
/product-maker:build-product "Build a task management SaaS with user auth, projects, tasks, and team collaboration" --max-iterations 100 --completion-promise "DEPLOYED"
```

### What Happens

1. Plugin creates `.product-maker-state.yaml` tracking loop progress
2. Claude begins working on the product (BUILDER)
3. Every 2 iterations, Claude switches to TESTER role
4. TESTER documents bugs in TESTLOG.md
5. BUILDER fixes bugs, then continues building
6. Loop continues until "DEPLOYED" appears AND no critical bugs
7. Completion report generated when done

## Commands

### /product-maker:build-product

Start building a product in an autonomous loop.

**Syntax:**
```bash
/product-maker:build-product "<product description>" [OPTIONS]
```

**Options:**
- `--max-iterations <N>` - Maximum iterations (default: 100)
- `--completion-promise "<text>"` - Exact text that signals completion
- `--enable-reflection` - Enable iteration logging and checkpoints
- `--checkpoint-interval <N>` - Checkpoint every N iterations (default: 10)
- `--with-tester` - Enable QA tester mode (default: enabled)
- `--no-tester` - Disable QA tester mode
- `--test-every <N>` - Run tester every N iterations (default: 2)

**Example:**
```bash
/product-maker:build-product "Build a Shopify app for automated inventory management with real-time stock alerts, supplier integration, and analytics dashboard. Deploy to Vercel." --max-iterations 150 --completion-promise "APP_LIVE" --test-every 3
```

### /product-maker:test-status

Show current QA test status.

```bash
/product-maker:test-status
```

**Output:**
```
Product Maker - Test Status
================================

  CRITICAL: 0 open
  MEDIUM: 2 open
  LOW: 5 open
  FIXED: 8 total

Last test sweep: Iteration 12
Status: Ready for completion (no critical bugs)
```

### /product-maker:cancel

Cancel the active loop.

```bash
/product-maker:cancel
```

Stops the loop gracefully after current iteration completes.

### /product-maker:help

Show detailed help and examples.

```bash
/product-maker:help
```

## QA Tester Mode

The QA Tester creates a builder/tester alternation loop that ensures quality:

### The Flow

```
Iteration 1 (BUILDER) -> Builds features from PRD
Iteration 2 (TESTER)  -> Tests everything, writes bugs to TESTLOG.md
Iteration 3 (BUILDER) -> Fixes CRITICAL bugs, then MEDIUM, then builds more
Iteration 4 (TESTER)  -> Tests again, updates TESTLOG.md
... and so on until complete
```

### TESTLOG.md Format

The tester documents all findings in a structured format:

```markdown
## Test Sweep - Iteration 4 - 2024-01-15 10:30:00

### CRITICAL (bloqueantes)
- [BUG-001] API returns 500 on empty request body
  - Steps to reproduce: POST /api/users with {}
  - Expected: 400 Bad Request with validation error
  - Actual: 500 Internal Server Error
  - File: src/routes/users.ts:45

### MEDIUM (deben arreglarse)
- [BUG-002] Login form accepts spaces-only password
  - Steps to reproduce: Enter "     " as password
  - Expected: Validation error
  - Actual: Attempts login

### LOW (nice to fix)
- [BUG-003] Typo in error message "Unauthroized"

### PASSED
- User registration works correctly
- JWT tokens are properly validated
- Password hashing is secure

### Coverage
- Tests executed: 45
- Tests passing: 42
- Tests failing: 3
- Coverage estimated: 78%
```

### Safety Feature

The loop will NOT complete even if the completion promise is found, if there are critical bugs open. This ensures you ship quality products.

### When Bugs Are Fixed

The builder marks fixed bugs in TESTLOG.md:

```markdown
- [BUG-001] API returns 500 on empty request body - FIXED (commit: a1b2c3d)
```

## Writing Effective Prompts

### The Anatomy of a Great Product Prompt

```bash
/product-maker:build-product "
Build a [PRODUCT TYPE] that [VALUE PROPOSITION].

Core Features:
- Feature 1: [specific implementation details]
- Feature 2: [specific implementation details]
- Feature 3: [specific implementation details]

Technical Requirements:
- Frontend: [framework/library]
- Backend: [framework/language]
- Database: [system]
- Auth: [method]
- Deployment: [platform]

Quality Standards:
- Test coverage > 80%
- Performance: [specific benchmarks]
- Documentation: README + API docs
- Error handling for all user inputs

Success Criteria:
- All features working in production
- All tests passing
- Deployed to [environment]
- Performance benchmarks met
- Documentation complete

Output <promise>PRODUCTION_READY</promise> when complete.
" --max-iterations 120 --completion-promise "PRODUCTION_READY"
```

### Bad vs Good Examples

**Bad - Too Vague:**
```bash
"Build a web app for managing stuff"
```

**Good - Specific:**
```bash
"Build a debt collection management system with:
- WhatsApp API integration for automated messages
- Call center dashboard with real-time metrics
- Payment tracking and reconciliation
- Manager approval workflow for discounts
- Multi-tenant architecture
- Deploy to AWS
Output <promise>SYSTEM_DEPLOYED</promise> when all features live"
```

## Use Cases

### Perfect For

- **MVPs**: Build minimum viable products overnight
- **SaaS Platforms**: Complete web applications with auth, database, payments
- **API Services**: REST/GraphQL APIs with full test coverage
- **Automation Tools**: n8n workflows, Zapier alternatives, custom integrations
- **Internal Tools**: Admin dashboards, data processors, reporting systems
- **Migrations**: Codebase migrations or framework upgrades

### Not Ideal For

- Quick one-off tasks (use regular Claude Code)
- Tasks requiring constant human judgment
- Highly creative/subjective work
- Debugging specific bugs (better done manually)

## Real-World Examples

### Example 1: SaaS Dashboard with QA

```bash
/product-maker:build-product "
Build a project management SaaS:
- User authentication with JWT
- Project CRUD with team members
- Task management with drag-drop
- Real-time updates via WebSocket
- Team collaboration features
- Dashboard analytics
- Stripe billing integration
Frontend: Next.js + Tailwind
Backend: Node.js + Express
Database: PostgreSQL + Prisma
Deploy: Vercel (frontend) + Railway (backend)
Test coverage >80%
Output <promise>SAAS_DEPLOYED</promise> when live
" --max-iterations 150 --completion-promise "SAAS_DEPLOYED" --test-every 2
```

### Example 2: API with Aggressive Testing

```bash
/product-maker:build-product "
Build REST API for fitness tracking:
- User registration and auth
- Workout logging
- Statistics dashboard
- Goal tracking
Deploy to Railway with CI/CD
Output <promise>API_LIVE</promise> when deployed
" --max-iterations 80 --completion-promise "API_LIVE" --test-every 2
```

### Example 3: Quick Prototype (No Tester)

```bash
/product-maker:build-product "
Build a landing page for ProductX:
- Hero section
- Features grid
- Pricing table
- Contact form
Deploy to Vercel
Output <promise>LANDING_LIVE</promise>
" --max-iterations 30 --completion-promise "LANDING_LIVE" --no-tester
```

## Advanced Features

### Combining Reflection + Tester

For large projects, use both:

```bash
/product-maker:build-product "..." --max-iterations 200 --enable-reflection --checkpoint-interval 15 --test-every 3
```

This gives you:
- Iteration logging for context
- Checkpoints every 15 iterations
- QA testing every 3 iterations
- Comprehensive quality control

### Phase-Based Development

Break large products into phases:

```bash
# Phase 1: Core API
/product-maker:build-product "Phase 1: Build REST API with auth..." --max-iterations 50 --completion-promise "PHASE1_DONE"

# Phase 2: Frontend
/product-maker:build-product "Phase 2: Build React dashboard..." --max-iterations 50 --completion-promise "PHASE2_DONE"

# Phase 3: Integrations
/product-maker:build-product "Phase 3: Add third-party integrations..." --max-iterations 40 --completion-promise "PHASE3_DONE"
```

## Monitoring & Debugging

### Check Progress

```bash
# View current iteration
cat .product-maker-state.yaml

# Watch logs in real-time
tail -f .product-maker/loop.log

# See recent work
git log --oneline -20

# Check QA status
/product-maker:test-status
```

### State File Structure

```yaml
---
active: true
current_iteration: 23
max_iterations: 100
completion_promise: "DEPLOYED"
with_tester: true
test_every: 2
current_role: "builder"
bugs_open_critical: 0
bugs_open_medium: 2
bugs_open_low: 3
bugs_fixed_total: 8
last_test_sweep: 22
test_sweeps_completed: 11
started_at: "2024-01-15T10:00:00Z"
last_iteration_at: "2024-01-15T12:45:00Z"
---
Build a task management SaaS...
```

## Safety Mechanisms

1. **Max Iterations Limit**: Prevents infinite loops
2. **Completion Promise**: Requires explicit success signal
3. **Critical Bug Block**: Won't complete with critical bugs open
4. **Git Integration**: Auto-commits preserve all work
5. **State Persistence**: Survives crashes and interruptions
6. **Cancellation**: Graceful stop anytime
7. **Error Recovery**: Loop continues even after failures

## Troubleshooting

### Loop Not Starting

**Problem**: Command runs but loop doesn't activate

**Solution**:
```bash
# Check state file exists
ls -la .product-maker-state.yaml

# Verify hook is executable
ls -la ~/.claude/plugins/product-maker/scripts/*.sh

# Make scripts executable if needed
chmod +x ~/.claude/plugins/product-maker/scripts/*.sh
```

### Stuck on Critical Bugs

**Problem**: Loop keeps running because critical bugs aren't getting fixed

**Solution**:
- Check TESTLOG.md to understand the bugs
- Consider if they're actually critical or should be reclassified
- Cancel, fix manually, and restart if needed
- Use `--no-tester` for prototypes where bugs are acceptable

### Not Converging to Solution

**Problem**: Loop runs but doesn't complete product

**Solution**:
- Make completion criteria more specific
- Break into smaller phases
- Reduce scope of initial version
- Add intermediate checkpoints
- Increase max iterations

## Best Practices

### 1. Start with a PRD

Create a Product Requirements Document first, then convert to prompt.

### 2. Set Realistic Iterations

- **Simple CRUD app**: 30-50 iterations
- **SaaS dashboard**: 80-120 iterations
- **Complex platform**: 150-250 iterations
- **Migration**: 50-100 iterations

### 3. Choose the Right Test Frequency

- `--test-every 2` (default): Aggressive testing, higher quality
- `--test-every 3`: Balanced approach
- `--test-every 4-5`: More building, less testing
- `--no-tester`: Maximum speed, manual testing later

### 4. Monitor Periodically

Check progress every few hours:
```bash
git log --oneline -10
/product-maker:test-status
tail -20 .product-maker/loop.log
```

### 5. Iterate on Prompts

If first attempt doesn't converge:
1. Cancel the loop
2. Review what was built and TESTLOG.md
3. Refine your prompt
4. Add more specific criteria
5. Restart with better prompt

## Cost Estimation

Based on Claude Sonnet 4 API pricing:

- **Simple app** (50 iterations): ~$5-15
- **Medium SaaS** (100 iterations): ~$20-40
- **Complex platform** (200 iterations): ~$50-100

QA tester mode adds ~20-30% more iterations but catches bugs early.

## Philosophy

> "The skill is in writing prompts that converge toward working, tested products."

Product Maker embraces:
- **Quality over speed**: The tester ensures you ship working code
- **Iteration over perfection**: Let the loop refine
- **Deterministic failure**: Predictable failures teach us
- **Automation over babysitting**: Define goals, let AI work

## Contributing

Found a bug? Have an idea?

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - Build whatever you want

## Credits

- **Technique**: Based on Ralph Wiggum by Geoffrey Huntley
- **Built by**: Ale @ Spicy Automations
- **Optimized for**: Building complete, tested products

## Support

Having issues?

1. Check the troubleshooting section
2. Review logs in `.product-maker/`
3. Check `/product-maker:test-status`
4. Try the `/product-maker:help` command
5. Open an issue on GitHub

## Changelog

### v1.1.0 (Current)
- **NEW**: Integrated QA Tester mode
- **NEW**: TESTLOG.md for bug tracking
- **NEW**: `/product-maker:test-status` command
- **NEW**: `--with-tester` / `--no-tester` flags
- **NEW**: `--test-every` flag
- **NEW**: Critical bug blocking (won't complete with critical bugs)
- **IMPROVED**: Completion reports include QA stats

### v1.0.0
- Initial release
- Stop hook implementation
- State management
- Logging system
- Completion reports
- Cancel functionality

---

**Ready to ship tested products?**

```bash
/product-maker:build-product "Your product idea here..." --max-iterations 100 --completion-promise "SHIPPED"
```

Let's build something amazing.
