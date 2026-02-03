# Product Maker Plugin - Project Overview

## 🎯 Purpose

Transform Claude Code into a **product shipping machine** that builds complete applications autonomously while you sleep.

## 🏗️ Architecture

```
product-maker-plugin/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest and configuration
│
├── commands/                     # Slash commands for Claude Code
│   ├── build-product.md         # Main command to start building
│   ├── cancel.md                # Command to stop the loop
│   └── help.md                  # Help documentation
│
├── hooks/                        # Event hooks
│   └── hooks.json               # Hook configuration
│
├── scripts/                      # Executable scripts
│   ├── stop-hook.sh             # Main loop logic (intercepts exit)
│   ├── setup-product-loop.sh    # Initialize loop state
│   └── cancel-loop.sh           # Graceful cancellation
│
├── README.md                     # Full documentation
├── QUICKSTART.md                # 5-minute getting started guide
├── INSTALL.md                   # Detailed installation instructions
├── EXAMPLES.md                  # Battle-tested prompt examples
└── LICENSE                      # MIT License
```

## 🔑 Key Components

### 1. Plugin Manifest (.claude-plugin/plugin.json)
- Defines plugin metadata
- Registers commands and hooks
- Sets default configuration

### 2. Commands (commands/*.md)
- `/product-maker:build-product` - Start autonomous building
- `/product-maker:cancel` - Stop the loop
- `/product-maker:help` - Show documentation

### 3. Stop Hook (scripts/stop-hook.sh)
**The Magic** ✨
- Intercepts Claude's exit attempts
- Checks completion criteria:
  - Max iterations reached?
  - Completion promise found?
- If not complete: feeds prompt back (exit code 2)
- If complete: allows exit (exit code 0)

### 4. State Management
Creates `.product-maker-state.yaml`:
```yaml
---
active: true
current_iteration: 23
max_iterations: 100
completion_promise: "DEPLOYED"
started_at: "2024-01-15T10:00:00Z"
last_iteration_at: "2024-01-15T12:45:00Z"
---
Build a SaaS platform...
```

## 🔄 How It Works

```
┌─────────────────────────────────────────────┐
│  User runs /product-maker:build-product     │
│  - Creates state file                       │
│  - Initializes logs                         │
│  - Feeds prompt to Claude                   │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Claude works on the product                │
│  - Plans architecture                       │
│  - Writes code                              │
│  - Runs tests                               │
│  - Commits to git                           │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Claude tries to exit                       │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Stop Hook Activates                        │
│  - Reads state file                         │
│  - Increments iteration counter             │
│  - Checks completion criteria               │
└──────────────────┬──────────────────────────┘
                   │
           ┌───────┴────────┐
           │                │
         YES│              NO│
           │                │
           ▼                ▼
    ┌──────────┐    ┌──────────────┐
    │ Complete │    │ Continue Loop │
    │ Exit(0)  │    │ Exit(2)       │
    └──────────┘    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Feed prompt   │
                    │ back to Claude│
                    └───────┬───────┘
                            │
                            └──────┐
                                   │
                    ┌──────────────▼──────────────┐
                    │  Loop continues with new     │
                    │  context from git history    │
                    └─────────────────────────────┘
```

## 💪 Core Features

1. **Autonomous Development**
   - Works for hours without intervention
   - Iteratively improves the product
   - Self-corrects based on test failures

2. **State Persistence**
   - Survives crashes
   - Continues from last iteration
   - All progress saved via git

3. **Safety Mechanisms**
   - Max iteration limits
   - Completion promises
   - Graceful cancellation
   - Error recovery

4. **Quality Enforcement**
   - Test coverage requirements
   - Performance benchmarks
   - Deployment verification
   - Documentation completion

5. **Progress Monitoring**
   - Real-time logs
   - Git commit history
   - Iteration counting
   - Completion reports

## 🎨 Design Philosophy

**Based on Ralph Wiggum Technique**
- Continuous iteration beats perfect first try
- Deterministic failure is better than unpredictable success
- Let AI learn from its mistakes
- Convergence through repetition

**Optimized for Products, Not Just Code**
- Focus on complete, deployable applications
- Includes deployment and testing
- Documentation is required
- Production-ready standards

## 📊 Use Cases

Perfect for:
- ✅ MVPs and SaaS products
- ✅ Complete REST/GraphQL APIs
- ✅ Full-stack web applications
- ✅ Mobile apps (React Native)
- ✅ Chrome extensions
- ✅ Automation tools
- ✅ Code migrations
- ✅ Internal tools

Not ideal for:
- ❌ Quick one-off tasks
- ❌ Debugging specific bugs
- ❌ Code reviews
- ❌ Highly creative work

## 🚀 Performance

**Typical Results:**
- Simple API: 30-50 iterations (~20 mins)
- SaaS Dashboard: 80-120 iterations (~1-2 hours)
- Complex Platform: 150-250 iterations (~3-5 hours)

**Cost Estimates (Claude Sonnet 4):**
- Simple app: $5-15
- Medium SaaS: $20-40
- Complex platform: $50-100

## 🔐 Security

- All operations local to project directory
- No external network calls (except Claude API)
- State files are project-specific
- Git commits use your identity
- All scripts are open source

## 🛠️ Technical Requirements

- **OS**: macOS, Linux, or Windows with WSL
- **Claude Code**: v2.0+
- **Git**: v2.20+
- **Bash**: v4.0+
- **Disk**: ~1MB for plugin
- **API**: Claude API access

## 📈 Roadmap

**v1.0 (Current)**
- ✅ Core loop functionality
- ✅ State management
- ✅ Completion detection
- ✅ Logging system
- ✅ Documentation

**v1.1 (Planned)**
- ⏳ Advanced error recovery
- ⏳ Resume from specific iteration
- ⏳ Multiple completion conditions
- ⏳ Template library
- ⏳ Performance metrics

**v1.2 (Future)**
- 🔮 Cost estimation
- 🔮 Progress visualization
- 🔮 Parallel phase execution
- 🔮 Cloud state sync
- 🔮 Marketplace integration

## 🤝 Contributing

Contributions welcome! Areas to improve:
- Additional example prompts
- Bug fixes and error handling
- Performance optimizations
- Documentation improvements
- Platform compatibility (Windows native)

## 📄 License

MIT License - Build whatever you want

## 🙏 Credits

**Inspiration:**
- Ralph Wiggum technique by Geoffrey Huntley
- Claude Code by Anthropic
- The Simpsons (for the name inspiration)

**Built by:**
- Ale @ Spicy Automations
- Optimized for building products fast

## 📞 Support

- **Documentation**: See README.md
- **Examples**: Check EXAMPLES.md
- **Installation Help**: Read INSTALL.md
- **Quick Start**: See QUICKSTART.md
- **Issues**: GitHub Issues
- **Discussion**: GitHub Discussions

## 🎯 Project Goals

1. **Speed**: Ship products in hours, not weeks
2. **Quality**: Production-ready code with tests
3. **Automation**: Minimal human intervention
4. **Reliability**: Consistent results
5. **Simplicity**: Easy to use and understand

## 📝 Next Steps

After understanding the architecture:

1. **Install the plugin** - Follow INSTALL.md
2. **Try a quick test** - Use QUICKSTART.md
3. **Build something real** - Pick from EXAMPLES.md
4. **Iterate and improve** - Refine your prompts
5. **Share your results** - Contribute back!

---

**Ready to ship products?** 🚀

Start with:
```bash
/product-maker:build-product "Your product idea..." --max-iterations 100 --completion-promise "SHIPPED"
```

Let's build something amazing together!
