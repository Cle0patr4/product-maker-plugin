# /product-maker:help

Get help with the Product Maker plugin.

## Overview

Product Maker is an autonomous development loop plugin that builds complete products from idea to deployment. It's based on the Ralph Wiggum technique but optimized for creating full applications.

## Core Concept

**"Ship products while you sleep"**

You provide a detailed product description once, and Claude Code works iteratively until the product is complete, tested, and deployed.

## How It Works

```
You run ONCE:
/product-maker:build-product "Build a SaaS platform..." --completion-promise "DEPLOYED"

Then automatically:
1. Claude plans the product architecture
2. Implements features iteratively  
3. Runs tests and fixes bugs
4. Attempts to exit when done
5. Stop hook blocks exit
6. Stop hook feeds the SAME prompt back
7. Repeat until DEPLOYED
```

## The Loop

```
┌─────────────────────────────────────┐
│  Read prompt from state file        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Claude works on product            │
│  - Implements features              │
│  - Runs tests                       │
│  - Commits progress                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Claude tries to exit               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Stop hook checks:                  │
│  - Max iterations reached?          │
│  - Completion promise found?        │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
    YES│                │NO
       │                │
       ▼                ▼
    [EXIT]      [FEED PROMPT BACK]
                       │
                       └──────┐
                              │
                              ▼
                    [LOOP CONTINUES]
```

## Commands

- `/product-maker:build-product` - Start building a product
- `/product-maker:cancel` - Cancel the active loop
- `/product-maker:help` - Show this help

## Writing Effective Prompts

**The 5 Ps:**
1. **Purpose**: What problem does this solve?
2. **Phases**: Break down into logical stages
3. **Promise**: Define clear completion criteria
4. **Parameters**: Set max iterations appropriately
5. **Precision**: Be specific about requirements

**Example Structure:**

```
Build a [PRODUCT TYPE] that [CORE VALUE PROP].

Required Features:
- Feature 1: [specific details]
- Feature 2: [specific details]
- Feature 3: [specific details]

Technical Stack:
- Frontend: [framework]
- Backend: [framework]
- Database: [system]
- Hosting: [platform]

Success Criteria:
- All features implemented and working
- Test coverage > 80%
- Deployed to [environment]
- Documentation complete
- Performance benchmarks met

Output <promise>PRODUCTION_READY</promise> when all criteria met.
```

## Configuration

Edit `.product-maker-state.yaml` to adjust:
- `max_iterations`: Safety limit
- `completion_promise`: Exit condition
- `current_iteration`: Current progress

## Safety Mechanisms

1. **Iteration Limit**: Prevents runaway loops
2. **State Persistence**: Survives crashes
3. **Git Integration**: Auto-commits progress
4. **Completion Promise**: Requires explicit signal
5. **Error Recovery**: Continues after failures

## Philosophy

> "Deterministically bad is better than unpredictably good"
> - Geoffrey Huntley

Let the loop fail and learn. Each iteration refines the approach. The skill is in writing prompts that converge toward working products.

## Tips for Success

1. **Start with a PRD**: Define the product clearly
2. **Set realistic iterations**: 50-150 for most products
3. **Use verifiable completion**: Tests passing, deployed, etc.
4. **Monitor progress**: Check git log periodically
5. **Iterate on prompts**: Refine based on results
6. **Break down mega-projects**: Phase large products

## Example Use Cases

**MVP SaaS Dashboard**
```bash
/product-maker:build-product "Build a project management SaaS with user auth, projects, tasks, and team collaboration. Deploy to Vercel." --max-iterations 120 --completion-promise "DEPLOYED_TO_VERCEL"
```

**API Migration**
```bash
/product-maker:build-product "Migrate REST API from Express to Fastify, maintain all endpoints, improve performance by 40%, update all tests." --max-iterations 80 --completion-promise "MIGRATION_COMPLETE"
```

**E-commerce Platform**
```bash
/product-maker:build-product "Build Shopify-like e-commerce: product catalog, cart, checkout, admin panel, Stripe integration. Test coverage >85%." --max-iterations 200 --completion-promise "STORE_LIVE"
```

## Troubleshooting

**Loop not starting?**
- Check `.product-maker-state.yaml` exists
- Verify hook permissions

**Loop running too long?**
- Reduce max_iterations
- Refine completion promise
- Break into smaller phases

**Not converging?**
- Make success criteria more specific
- Add intermediate checkpoints
- Simplify the scope

## Advanced Usage

**Batch Product Creation**
```bash
# Create script for overnight builds
cat << 'EOF' > build-products.sh
#!/bin/bash
cd /project1
claude -p "/product-maker:build-product 'Product 1...' --max-iterations 100"
cd /project2  
claude -p "/product-maker:build-product 'Product 2...' --max-iterations 100"
EOF
chmod +x build-products.sh
./build-products.sh
```

**Template Prompts**
Create reusable prompt templates for common product types:
- SaaS dashboards
- API services
- Mobile apps
- Chrome extensions
- Automation tools

## Resources

- Based on Ralph Wiggum technique by Geoffrey Huntley
- Optimized for Spicy Automations product development
- Designed for shipping products, not just code

## Support

For issues or questions:
- Check the logs in `.product-maker/`
- Review recent git commits
- Cancel and restart with refined prompt
