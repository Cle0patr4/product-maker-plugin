#!/bin/bash
# Product Maker Loop Initialization Script
# This script sets up the state file that drives the product building loop

set -euo pipefail

# Parse arguments
PROMPT=""
MAX_ITERATIONS=100
COMPLETION_PROMISE=""
REFLECTION_ENABLED="false"
CHECKPOINT_INTERVAL=10
WITH_TESTER="true"
TEST_EVERY=2

while [[ $# -gt 0 ]]; do
    case $1 in
        --max-iterations)
            MAX_ITERATIONS="$2"
            shift 2
            ;;
        --completion-promise)
            COMPLETION_PROMISE="$2"
            shift 2
            ;;
        --enable-reflection)
            REFLECTION_ENABLED="true"
            shift
            ;;
        --checkpoint-interval)
            CHECKPOINT_INTERVAL="$2"
            shift 2
            ;;
        --with-tester)
            WITH_TESTER="true"
            shift
            ;;
        --no-tester)
            WITH_TESTER="false"
            shift
            ;;
        --test-every)
            TEST_EVERY="$2"
            shift 2
            ;;
        *)
            if [[ -z "$PROMPT" ]]; then
                PROMPT="$1"
            fi
            shift
            ;;
    esac
done

# Validate inputs
if [[ -z "$PROMPT" ]]; then
    echo "Error: Product description required"
    echo "Usage: /product-maker:build-product \"<description>\" --max-iterations <N> --completion-promise \"<text>\" [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --max-iterations <N>      Maximum iterations (default: 100)"
    echo "  --completion-promise <T>  Text that signals completion"
    echo "  --enable-reflection       Enable iteration logging and checkpoints"
    echo "  --checkpoint-interval <N> Checkpoint every N iterations (default: 10)"
    echo "  --with-tester             Enable QA tester mode (default: enabled)"
    echo "  --no-tester               Disable QA tester mode"
    echo "  --test-every <N>          Run tester every N iterations (default: 2)"
    exit 1
fi

if [[ $MAX_ITERATIONS -lt 1 ]]; then
    echo "Error: max-iterations must be at least 1"
    exit 1
fi

if [[ $CHECKPOINT_INTERVAL -lt 1 ]]; then
    echo "Error: checkpoint-interval must be at least 1"
    exit 1
fi

if [[ $CHECKPOINT_INTERVAL -gt $MAX_ITERATIONS ]]; then
    echo "Warning: checkpoint-interval ($CHECKPOINT_INTERVAL) is greater than max-iterations ($MAX_ITERATIONS)"
    echo "No checkpoints will occur during this run."
fi

if [[ $TEST_EVERY -lt 2 ]]; then
    echo "Error: test-every must be at least 2 (need at least 1 build iteration between tests)"
    exit 1
fi

if [[ $TEST_EVERY -gt $MAX_ITERATIONS ]]; then
    echo "Warning: test-every ($TEST_EVERY) is greater than max-iterations ($MAX_ITERATIONS)"
    echo "No test sweeps will occur during this run."
fi

# Create state directory
mkdir -p .product-maker

# Create state file with QA tester fields
cat > .product-maker-state.yaml <<EOF
---
active: true
current_iteration: 0
max_iterations: $MAX_ITERATIONS
completion_promise: "$COMPLETION_PROMISE"
reflection_enabled: $REFLECTION_ENABLED
checkpoint_interval: $CHECKPOINT_INTERVAL
with_tester: $WITH_TESTER
test_every: $TEST_EVERY
current_role: "builder"
bugs_open_critical: 0
bugs_open_medium: 0
bugs_open_low: 0
bugs_fixed_total: 0
last_test_sweep: 0
test_sweeps_completed: 0
started_at: "$(date -Iseconds)"
last_iteration_at: "$(date -Iseconds)"
last_checkpoint_at: ""
---
$PROMPT
EOF

# Create initial log entry
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Product Maker loop initialized" > .product-maker/loop.log
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Max iterations: $MAX_ITERATIONS" >> .product-maker/loop.log
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Completion promise: '$COMPLETION_PROMISE'" >> .product-maker/loop.log
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Reflection enabled: $REFLECTION_ENABLED" >> .product-maker/loop.log
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Checkpoint interval: $CHECKPOINT_INTERVAL" >> .product-maker/loop.log
echo "[$(date '+%Y-%m-%d %H:%M:%S')] QA Tester enabled: $WITH_TESTER" >> .product-maker/loop.log
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Test every: $TEST_EVERY iterations" >> .product-maker/loop.log
echo "" >> .product-maker/loop.log
echo "Prompt:" >> .product-maker/loop.log
echo "$PROMPT" >> .product-maker/loop.log
echo "" >> .product-maker/loop.log

# Create README for the loop
cat > .product-maker/README.md <<EOF
# Product Maker Active Loop

This directory contains state and logs for an active Product Maker loop.

## Current Configuration

- **Max Iterations**: $MAX_ITERATIONS
- **Completion Promise**: \`$COMPLETION_PROMISE\`
- **Reflection Enabled**: $REFLECTION_ENABLED
- **Checkpoint Interval**: $CHECKPOINT_INTERVAL iterations
- **QA Tester Enabled**: $WITH_TESTER
- **Test Every**: $TEST_EVERY iterations
- **Started**: $(date)

## Files

- \`loop.log\` - Detailed iteration logs
- \`../product-maker-state.yaml\` - Current loop state (DO NOT EDIT MANUALLY)
- \`completion-report.md\` - Generated when loop completes successfully
- \`ITERATION-LOG.md\` - Progress log (when reflection enabled)
- \`CHECKPOINT-REPORT.md\` - Validation reports (when reflection enabled)
- \`../TESTLOG.md\` - QA test findings (when tester enabled)

## Monitoring Progress

\`\`\`bash
# Watch the log in real-time
tail -f .product-maker/loop.log

# Check current iteration
grep "current_iteration" .product-maker-state.yaml

# View recent commits
git log --oneline -20

# View iteration log (if reflection enabled)
cat ITERATION-LOG.md

# View latest checkpoint (if reflection enabled)
cat CHECKPOINT-REPORT.md

# View test status (if tester enabled)
/product-maker:test-status
# Or manually:
cat TESTLOG.md
\`\`\`

## Canceling

\`\`\`bash
/product-maker:cancel
\`\`\`

## QA Tester Mode

When QA Tester is enabled, iterations alternate between:
- **Builder** (odd iterations): Builds features, fixes bugs from TESTLOG.md
- **Tester** (every $TEST_EVERY iterations): Tests everything, documents bugs in TESTLOG.md

The loop will NOT complete if there are critical bugs open, even if the completion promise is found.

## Original Prompt

\`\`\`
$PROMPT
\`\`\`

---
Generated by Product Maker Plugin
EOF

echo "Product Maker loop initialized!"
echo ""
echo "Configuration:"
echo "  Max iterations: $MAX_ITERATIONS"
echo "  Completion promise: '$COMPLETION_PROMISE'"
echo "  Reflection enabled: $REFLECTION_ENABLED"
if [[ "$REFLECTION_ENABLED" == "true" ]]; then
    echo "  Checkpoint interval: every $CHECKPOINT_INTERVAL iterations"
fi
echo "  QA Tester enabled: $WITH_TESTER"
if [[ "$WITH_TESTER" == "true" ]]; then
    echo "  Test every: $TEST_EVERY iterations"
fi
echo ""
echo "The loop will now begin. Claude will:"
echo "  1. Work on your product iteratively"
echo "  2. Attempt to exit when done"
echo "  3. Continue automatically until completion or max iterations"
if [[ "$REFLECTION_ENABLED" == "true" ]]; then
    echo "  4. Log progress in ITERATION-LOG.md"
    echo "  5. Run full validation every $CHECKPOINT_INTERVAL iterations"
fi
if [[ "$WITH_TESTER" == "true" ]]; then
    echo "  - Alternate between BUILDER and TESTER roles"
    echo "  - Document bugs in TESTLOG.md"
    echo "  - Block completion if critical bugs are open"
fi
echo ""
echo "Monitor progress:"
echo "  tail -f .product-maker/loop.log"
if [[ "$REFLECTION_ENABLED" == "true" ]]; then
    echo "  cat ITERATION-LOG.md"
    echo "  cat CHECKPOINT-REPORT.md"
fi
if [[ "$WITH_TESTER" == "true" ]]; then
    echo "  /product-maker:test-status"
fi
echo ""
echo "Cancel anytime:"
echo "  /product-maker:cancel"
echo ""
echo "Starting product build now..."
echo ""

# Return the prompt to Claude to begin work
echo "$PROMPT"
