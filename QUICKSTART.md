# Product Maker - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install the Plugin

```bash
# Copy plugin to Claude plugins directory
cp -r product-maker-plugin ~/.claude/plugins/product-maker

# Make scripts executable
chmod +x ~/.claude/plugins/product-maker/scripts/*.sh
```

### 2. Start Claude Code

```bash
# Navigate to your project
cd ~/my-project
git init  # If not already a git repo

# Start Claude Code
claude
```

### 3. Build Your First Product

```bash
# Inside Claude Code, run:
/product-maker:build-product "Build a simple Express API with a GET /hello endpoint that returns {message: 'Hello World'}. Add a test. Output <promise>API_COMPLETE</promise> when done." --max-iterations 20 --completion-promise "API_COMPLETE"
```

### 4. Monitor Progress

```bash
# In another terminal, watch the logs
tail -f .product-maker/loop.log

# Or check git commits
git log --oneline
```

### 5. Review the Result

Once complete, you'll see:
- Working Express API
- Test file
- Completion report in `.product-maker/completion-report.md`

## 📖 Essential Commands

```bash
# Start building a product
/product-maker:build-product "<description>" --max-iterations <N> --completion-promise "<text>"

# Get help
/product-maker:help

# Cancel active loop
/product-maker:cancel
```

## 💡 Quick Tips

1. **Be Specific**: More detail = better results
2. **Set Iterations**: Start with 50-100 for most projects
3. **Use Promises**: Make them verifiable (e.g., "ALL_TESTS_PASS")
4. **Monitor Progress**: Check logs and git commits periodically
5. **Iterate**: If first attempt fails, refine your prompt and try again

## 🎯 Example Prompts

### Simple API
```bash
/product-maker:build-product "Build REST API with Express, PostgreSQL, JWT auth. Endpoints: /register, /login, /profile. Tests with coverage >80%. Deploy to Railway." --max-iterations 80 --completion-promise "API_DEPLOYED"
```

### SaaS Dashboard
```bash
/product-maker:build-product "Build Next.js dashboard with user auth, CRUD for projects, Tailwind UI. Deploy to Vercel." --max-iterations 100 --completion-promise "DASHBOARD_LIVE"
```

### Mobile App
```bash
/product-maker:build-product "Build React Native todo app with offline mode, Firebase backend. Publish to TestFlight." --max-iterations 120 --completion-promise "APP_IN_BETA"
```

## 🔧 Troubleshooting

**Loop not starting?**
```bash
# Check state file
cat .product-maker-state.yaml

# Verify hook permissions
ls -la ~/.claude/plugins/product-maker/scripts/stop-hook.sh
```

**Not completing?**
- Increase max iterations
- Make completion promise more specific
- Break into smaller phases

## 📚 Learn More

- **Full Documentation**: See `README.md`
- **Examples**: Check `EXAMPLES.md` for ready-to-use prompts
- **Installation**: Read `INSTALL.md` for detailed setup

## 🎉 You're Ready!

Start building amazing products with:

```bash
/product-maker:build-product "Your amazing product idea..." --max-iterations 100 --completion-promise "SHIPPED"
```

---

**Need Help?**

```bash
/product-maker:help
```
