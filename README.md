# Product Maker Plugin for Claude Code

**Ship complete products while you sleep** 🚀

An autonomous development loop plugin that transforms ideas into deployed products through iterative AI-driven development. Based on the Ralph Wiggum technique but optimized specifically for building complete applications from scratch.

## Overview

Product Maker is a Claude Code plugin that creates a self-referential feedback loop where Claude works continuously on your product until it's complete, tested, and deployed. You write the prompt once, and the plugin handles the iterative development process automatically.

```
You → Write prompt once
      ↓
Claude → Plans architecture
      → Implements features
      → Runs tests
      → Fixes bugs
      → Deploys
      ↓
You ← Wake up to a shipped product
```

## How It Works

Product Maker uses a **Stop Hook** that intercepts Claude's exit attempts:

1. You run the command ONCE with your product description
2. Claude works on the product
3. Claude tries to exit when done
4. Stop hook blocks the exit
5. Stop hook feeds the same prompt back to Claude
6. Claude sees its previous work and continues
7. Repeat until completion criteria met

This creates a continuous loop where:
- Each iteration builds on previous work
- Git commits preserve progress
- State persists across iterations
- Loop exits on completion promise or max iterations

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
3. Reload Claude Code or restart your session

## Quick Start

### Basic Usage

```bash
/product-maker:build-product "Build a task management SaaS with user auth, projects, tasks, and team collaboration" --max-iterations 100 --completion-promise "DEPLOYED"
```

### What Happens

1. Plugin creates `.product-maker-state.yaml` tracking loop progress
2. Claude begins working on the product
3. Each iteration: plan → code → test → commit → check completion
4. Loop continues until "DEPLOYED" appears in output OR 100 iterations reached
5. Completion report generated when done

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

**Example:**
```bash
/product-maker:build-product "Build a Shopify app for automated inventory management with real-time stock alerts, supplier integration, and analytics dashboard. Deploy to Vercel." --max-iterations 150 --completion-promise "APP_LIVE"
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

❌ **Bad - Too Vague:**
```bash
"Build a web app for managing stuff"
```

✅ **Good - Specific:**
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

❌ **Bad - No Exit Criteria:**
```bash
"Create an e-commerce platform"
```

✅ **Good - Clear Completion:**
```bash
"Build e-commerce platform with product catalog, cart, checkout, admin panel.
Deploy to Vercel. Test coverage >85%.
Output <promise>STORE_OPERATIONAL</promise> when:
- All CRUD operations working
- Stripe integration tested
- Admin panel functional
- Deployed with SSL"
```

## Use Cases

### 🎯 Perfect For

- **MVPs**: Build minimum viable products overnight
- **SaaS Platforms**: Complete web applications with auth, database, payments
- **API Services**: REST/GraphQL APIs with full test coverage
- **Automation Tools**: n8n workflows, Zapier alternatives, custom integrations
- **Internal Tools**: Admin dashboards, data processors, reporting systems
- **Migrations**: Codebase migrations or framework upgrades

### ⚠️ Not Ideal For

- Quick one-off tasks (use regular Claude Code)
- Tasks requiring constant human judgment
- Highly creative/subjective work
- Debugging specific bugs (better done manually)

## Real-World Examples

### Example 1: SaaS Dashboard

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
" --max-iterations 150 --completion-promise "SAAS_DEPLOYED"
```

### Example 2: API Migration

```bash
/product-maker:build-product "
Migrate existing REST API from Express to Fastify:
- Maintain all existing endpoints
- Improve response time by 40%
- Add request validation with Zod
- Implement rate limiting
- Update all tests to Vitest
- Add API documentation with Swagger
- Deploy to production
Output <promise>MIGRATION_COMPLETE</promise> when:
- All endpoints working
- Performance benchmarks met
- Tests at 100% coverage
- Documentation complete
- Production deployed
" --max-iterations 80 --completion-promise "MIGRATION_COMPLETE"
```

### Example 3: Automation Platform

```bash
/product-maker:build-product "
Build automation platform similar to Zapier:
- Visual workflow builder (React Flow)
- Pre-built integrations (Gmail, Slack, Notion, etc.)
- Custom webhook support
- Scheduled triggers
- Error handling and retry logic
- User dashboard with execution logs
- Webhook testing playground
Stack: React + Node.js + MongoDB
Deploy: Vercel + MongoDB Atlas
Output <promise>PLATFORM_LIVE</promise> when deployed
" --max-iterations 200 --completion-promise "PLATFORM_LIVE"
```

## Advanced Features

### Phase-Based Development

Break large products into phases:

```bash
# Phase 1: Core API
/product-maker:build-product "Phase 1: Build REST API with auth, user management, and database schema. Output <promise>PHASE1_DONE</promise>" --max-iterations 50

# Phase 2: Frontend
/product-maker:build-product "Phase 2: Build React dashboard consuming the API from Phase 1. Output <promise>PHASE2_DONE</promise>" --max-iterations 50

# Phase 3: Integrations
/product-maker:build-product "Phase 3: Add third-party integrations (Stripe, SendGrid, Twilio). Output <promise>PHASE3_DONE</promise>" --max-iterations 40
```

### Overnight Batch Builds

Create a script to build multiple products:

```bash
#!/bin/bash
# build-products-overnight.sh

cd ~/projects/product1
claude -p "/product-maker:build-product 'Build inventory management app...' --max-iterations 100"

cd ~/projects/product2  
claude -p "/product-maker:build-product 'Build analytics dashboard...' --max-iterations 120"

cd ~/projects/product3
claude -p "/product-maker:build-product 'Build API gateway...' --max-iterations 80"
```

Run before bed:
```bash
chmod +x build-products-overnight.sh
./build-products-overnight.sh
```

### Template Prompts

Save reusable templates:

```bash
# ~/.product-maker-templates/saas-starter.txt
Build a SaaS starter with:
- Next.js 14 + App Router
- Clerk authentication  
- Prisma + PostgreSQL
- Stripe subscriptions
- Admin dashboard
- Landing page with Tailwind
- Deploy to Vercel
Test coverage >75%
Output <promise>STARTER_DEPLOYED</promise>
```

Use templates:
```bash
/product-maker:build-product "$(cat ~/.product-maker-templates/saas-starter.txt)" --max-iterations 100 --completion-promise "STARTER_DEPLOYED"
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
```

### State File Structure

```yaml
---
active: true
current_iteration: 23
max_iterations: 100
completion_promise: "DEPLOYED"
started_at: "2024-01-15T10:00:00Z"
last_iteration_at: "2024-01-15T12:45:00Z"
---
Build a task management SaaS...
```

### Logs

Check `.product-maker/loop.log` for:
- Iteration progress
- Completion checks
- Error messages
- State transitions

## Safety Mechanisms

1. **Max Iterations Limit**: Prevents infinite loops
2. **Completion Promise**: Requires explicit success signal
3. **Git Integration**: Auto-commits preserve all work
4. **State Persistence**: Survives crashes and interruptions
5. **Cancellation**: Graceful stop anytime
6. **Error Recovery**: Loop continues even after failures

## Troubleshooting

### Loop Not Starting

**Problem**: Command runs but loop doesn't activate

**Solution**:
```bash
# Check state file exists
ls -la .product-maker-state.yaml

# Verify hook is executable
ls -la ~/.claude/plugins/product-maker/scripts/stop-hook.sh

# Check Claude Code hook configuration
cat ~/.claude/config/hooks.json
```

### Not Converging to Solution

**Problem**: Loop runs but doesn't complete product

**Solution**:
- Make completion criteria more specific
- Break into smaller phases
- Reduce scope of initial version
- Add intermediate checkpoints
- Increase max iterations

### Too Many Iterations

**Problem**: Using too many API calls

**Solution**:
```bash
# Reduce iterations
--max-iterations 30

# Add more specific success criteria
# Use verifiable completion promises
# Break into smaller phases
```

### Completion Promise Not Detected

**Problem**: Product is complete but loop continues

**Solution**:
- Use exact string matching in `<promise>` tags
- Add completion promise to git commit messages
- Make promise more unique/specific
- Check spelling and formatting

## Best Practices

### 1. Start with a PRD

Create a Product Requirements Document first:

```markdown
# Product: Task Manager Pro

## Problem
Teams need lightweight task management without Jira complexity

## Solution  
Simple SaaS for task tracking with team collaboration

## Features
1. User auth
2. Project management
3. Task CRUD with assignees
4. Real-time updates
5. Team collaboration

## Tech Stack
- Frontend: Next.js
- Backend: tRPC
- Database: PostgreSQL
- Hosting: Vercel
```

Then convert to prompt.

### 2. Set Realistic Iterations

- **Simple CRUD app**: 30-50 iterations
- **SaaS dashboard**: 80-120 iterations
- **Complex platform**: 150-250 iterations
- **Migration**: 50-100 iterations

### 3. Use Verifiable Completion

✅ Good completion promises:
- `ALL_TESTS_PASSING`
- `DEPLOYED_TO_PRODUCTION`
- `COVERAGE_80_PERCENT`
- `API_DOCUMENTED`

❌ Bad completion promises:
- `DONE`
- `FINISHED`
- `COMPLETE`

### 4. Monitor Periodically

Check progress every few hours:
```bash
git log --oneline -10
tail -20 .product-maker/loop.log
```

### 5. Iterate on Prompts

If first attempt doesn't converge:
1. Cancel the loop
2. Review what was built
3. Refine your prompt
4. Add more specific criteria
5. Restart with better prompt

## Cost Estimation

Based on Claude Sonnet 4 API pricing:

- **Simple app** (50 iterations): ~$5-15
- **Medium SaaS** (100 iterations): ~$20-40
- **Complex platform** (200 iterations): ~$50-100

Actual costs vary by:
- Code complexity
- Test coverage requirements
- Number of features
- Iteration efficiency

## Performance Tips

### Write Better Prompts

- Be specific about tech stack
- Include file structure expectations
- Define clear success metrics
- Add quality requirements
- Specify deployment target

### Optimize Iterations

```bash
# Good: Specific and scoped
"Build user authentication with JWT, password hashing, email verification"

# Bad: Too broad
"Build authentication"
```

### Use Git Effectively

The loop auto-commits, but you can:
```bash
# Review progress
git log --stat

# Compare iterations
git diff HEAD~5

# Rollback if needed
git reset --hard HEAD~10
```

## Philosophy

> "The skill is in writing prompts that converge toward working products, not in manually guiding every step."

Product Maker embraces:
- **Iteration over perfection**: Let the loop refine
- **Deterministic failure**: Predictable failures teach us
- **Automation over babysitting**: Define goals, let AI work
- **Convergence over control**: Guide toward success criteria

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
- **Optimized for**: Building complete products, not just code

## Support

Having issues?

1. Check the troubleshooting section
2. Review logs in `.product-maker/`
3. Try the `/product-maker:help` command
4. Open an issue on GitHub

## Changelog

### v1.0.0 (Current)
- Initial release
- Stop hook implementation
- State management
- Logging system
- Completion reports
- Cancel functionality

---

**Ready to ship products?**

```bash
/product-maker:build-product "Your product idea here..." --max-iterations 100 --completion-promise "SHIPPED"
```

🚀 Let's build something amazing.
