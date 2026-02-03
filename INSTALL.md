# Product Maker - Installation Guide

## Prerequisites

Before installing Product Maker, ensure you have:

- Claude Code installed and configured
- Git installed and configured
- Bash shell (macOS/Linux or WSL on Windows)
- Claude API key configured

## Installation Methods

### Method 1: Via Claude Code Marketplace (Recommended - Coming Soon)

Once available in the marketplace:

```bash
# Inside Claude Code
/plugin install product-maker@spicy-automations
```

### Method 2: Manual Installation

#### Step 1: Download the Plugin

```bash
# Clone the repository
git clone https://github.com/spicy-automations/product-maker-plugin.git

# Or download and extract ZIP
wget https://github.com/spicy-automations/product-maker-plugin/archive/main.zip
unzip main.zip
```

#### Step 2: Copy to Claude Plugins Directory

```bash
# Find your Claude plugins directory
# Usually: ~/.claude/plugins/

# Copy the plugin
cp -r product-maker-plugin ~/.claude/plugins/product-maker
```

#### Step 3: Set Permissions

```bash
# Make scripts executable
chmod +x ~/.claude/plugins/product-maker/scripts/*.sh
```

#### Step 4: Verify Installation

```bash
# Start Claude Code in any project
claude

# Inside Claude Code, type:
/product-maker:help
```

If you see the help documentation, installation was successful! ✅

### Method 3: Development Installation

For development and testing:

```bash
# Clone the repository
git clone https://github.com/spicy-automations/product-maker-plugin.git
cd product-maker-plugin

# Create symlink to Claude plugins directory
ln -s $(pwd) ~/.claude/plugins/product-maker

# This allows you to edit files and test changes immediately
```

## Verifying Installation

Run these commands to verify everything is working:

```bash
# 1. Check plugin is recognized
claude

# Inside Claude Code:
/plugin list

# Should show "product-maker" in the list

# 2. Test help command
/product-maker:help

# Should display detailed help information

# 3. Check hook is working
ls -la ~/.claude/plugins/product-maker/scripts/stop-hook.sh

# Should show executable permissions (-rwxr-xr-x)
```

## Configuration

### Default Settings

The plugin comes with sensible defaults:

```json
{
  "default_max_iterations": 100,
  "default_timeout_minutes": 120
}
```

### Customizing Settings

Edit `~/.claude/plugins/product-maker/.claude-plugin/plugin.json`:

```json
{
  "name": "product-maker",
  "version": "1.0.0",
  "settings": {
    "default_max_iterations": 150,  // Change default iterations
    "default_timeout_minutes": 180  // Change timeout
  }
}
```

## First Use

### Quick Test

Try building a simple app to verify everything works:

```bash
# Navigate to a test directory
mkdir ~/test-product-maker
cd ~/test-product-maker
git init

# Start Claude Code
claude

# Run a simple build
/product-maker:build-product "Build a simple Express API with one GET endpoint at /health that returns {status: 'ok'}. Add a test. Output <promise>SIMPLE_API_DONE</promise> when complete." --max-iterations 10 --completion-promise "SIMPLE_API_DONE"
```

This should:
1. Create the Express app
2. Add the /health endpoint
3. Write a test
4. Run the test
5. Output the completion promise
6. Exit successfully

## Troubleshooting Installation

### Plugin Not Found

**Problem**: `/product-maker:help` shows "command not found"

**Solution**:
```bash
# Check plugin directory exists
ls -la ~/.claude/plugins/product-maker

# If not, check your Claude plugins path:
claude --config-path

# Copy plugin to correct location
```

### Hook Not Executing

**Problem**: Loop doesn't continue, exits after first iteration

**Solution**:
```bash
# Check hook script permissions
ls -la ~/.claude/plugins/product-maker/scripts/stop-hook.sh

# If not executable, fix permissions:
chmod +x ~/.claude/plugins/product-maker/scripts/stop-hook.sh

# Check hooks configuration
cat ~/.claude/plugins/product-maker/hooks/hooks.json
```

### State File Issues

**Problem**: `.product-maker-state.yaml` not created

**Solution**:
```bash
# Ensure you have write permissions in project directory
touch .test-file
rm .test-file

# Check setup script is executable
chmod +x ~/.claude/plugins/product-maker/scripts/setup-product-loop.sh
```

### Windows/WSL Issues

**Problem**: Scripts fail on Windows or WSL

**Solution**:
```bash
# Ensure using WSL (not Git Bash)
# Install dos2unix if line endings are wrong
sudo apt-get install dos2unix

# Fix line endings
find ~/.claude/plugins/product-maker -name "*.sh" -exec dos2unix {} \;

# Set permissions again
chmod +x ~/.claude/plugins/product-maker/scripts/*.sh
```

## Updating the Plugin

### From Marketplace (When Available)

```bash
/plugin update product-maker
```

### Manual Update

```bash
# Backup your current version
cp -r ~/.claude/plugins/product-maker ~/.claude/plugins/product-maker.backup

# Download new version
git clone https://github.com/spicy-automations/product-maker-plugin.git
cp -r product-maker-plugin/* ~/.claude/plugins/product-maker/

# Set permissions
chmod +x ~/.claude/plugins/product-maker/scripts/*.sh

# Restart Claude Code
```

## Uninstalling

### Complete Removal

```bash
# Remove plugin directory
rm -rf ~/.claude/plugins/product-maker

# Remove any global state (if you want)
find ~ -name ".product-maker-state.yaml" -delete
find ~ -name ".product-maker" -type d -exec rm -rf {} +

# Restart Claude Code
```

### Temporary Disable

```bash
# Rename plugin directory
mv ~/.claude/plugins/product-maker ~/.claude/plugins/product-maker.disabled

# To re-enable
mv ~/.claude/plugins/product-maker.disabled ~/.claude/plugins/product-maker
```

## Next Steps

After successful installation:

1. **Read the Documentation**
   ```bash
   /product-maker:help
   ```

2. **Try Example Prompts**
   - See `EXAMPLES.md` for ready-to-use prompts
   - Start with a simple project

3. **Build Your First Product**
   ```bash
   /product-maker:build-product "Your product idea..." --max-iterations 50 --completion-promise "DONE"
   ```

4. **Monitor Progress**
   ```bash
   tail -f .product-maker/loop.log
   ```

5. **Review Results**
   ```bash
   git log --oneline
   cat .product-maker/completion-report.md
   ```

## Support

If you encounter issues:

1. Check this installation guide
2. Review the troubleshooting section
3. Check GitHub issues
4. Open a new issue with:
   - Your OS and Claude Code version
   - Error messages
   - Steps to reproduce

## System Requirements

- **OS**: macOS, Linux, or Windows with WSL
- **Claude Code**: v2.0 or higher
- **Git**: v2.20 or higher
- **Bash**: v4.0 or higher
- **Disk Space**: ~1MB for plugin files
- **Memory**: Standard Claude Code requirements

## Security Notes

- The plugin only operates within your project directory
- All scripts are open source and reviewable
- No external network calls except Claude API
- State files are local only
- Git commits use your configured identity

## License

MIT License - See LICENSE file for details

---

**Installation Complete!** 🎉

Ready to build products? Start with:

```bash
/product-maker:help
```

Then check out `EXAMPLES.md` for ready-to-use prompts!
