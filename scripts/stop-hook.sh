#!/bin/bash
# Product Maker Stop Hook
# This hook intercepts Claude's exit attempts and continues the loop until completion
# Supports builder/tester alternation mode for integrated QA

set -euo pipefail

STATE_FILE=".product-maker-state.yaml"
LOG_FILE=".product-maker/loop.log"
TESTLOG_FILE="TESTLOG.md"

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Check if state file exists
if [[ ! -f "$STATE_FILE" ]]; then
    log "No active product-maker loop found. Exiting normally."
    exit 0  # Allow normal exit
fi

# Read state file
if ! STATE=$(cat "$STATE_FILE" 2>/dev/null); then
    log "Error reading state file. Exiting normally."
    exit 0
fi

# Parse YAML using grep and sed (simple parsing, no dependencies)
get_value() {
    local key=$1
    grep "^$key:" "$STATE_FILE" | sed "s/^$key: *//" | sed 's/^"//' | sed 's/"$//'
}

ACTIVE=$(get_value "active")
CURRENT_ITERATION=$(get_value "current_iteration")
MAX_ITERATIONS=$(get_value "max_iterations")
COMPLETION_PROMISE=$(get_value "completion_promise")
REFLECTION_ENABLED=$(get_value "reflection_enabled")
CHECKPOINT_INTERVAL=$(get_value "checkpoint_interval")
WITH_TESTER=$(get_value "with_tester")
TEST_EVERY=$(get_value "test_every")

# QA Tester state fields
CURRENT_ROLE=$(get_value "current_role")
BUGS_OPEN_CRITICAL=$(get_value "bugs_open_critical")
BUGS_OPEN_MEDIUM=$(get_value "bugs_open_medium")
BUGS_OPEN_LOW=$(get_value "bugs_open_low")
BUGS_FIXED_TOTAL=$(get_value "bugs_fixed_total")
LAST_TEST_SWEEP=$(get_value "last_test_sweep")
TEST_SWEEPS_COMPLETED=$(get_value "test_sweeps_completed")

# Set defaults for QA fields if not present
CURRENT_ROLE="${CURRENT_ROLE:-builder}"
BUGS_OPEN_CRITICAL="${BUGS_OPEN_CRITICAL:-0}"
BUGS_OPEN_MEDIUM="${BUGS_OPEN_MEDIUM:-0}"
BUGS_OPEN_LOW="${BUGS_OPEN_LOW:-0}"
BUGS_FIXED_TOTAL="${BUGS_FIXED_TOTAL:-0}"
LAST_TEST_SWEEP="${LAST_TEST_SWEEP:-0}"
TEST_SWEEPS_COMPLETED="${TEST_SWEEPS_COMPLETED:-0}"
WITH_TESTER="${WITH_TESTER:-false}"
TEST_EVERY="${TEST_EVERY:-2}"

# Extract prompt (everything after the second ---)
PROMPT=$(awk '/^---$/{n++; next} n==2{print}' "$STATE_FILE")

# Check if loop is active
if [[ "$ACTIVE" != "true" ]]; then
    log "Loop is not active. Exiting normally."
    exit 0
fi

# Increment iteration counter
CURRENT_ITERATION=$((CURRENT_ITERATION + 1))
log "Starting iteration $CURRENT_ITERATION of $MAX_ITERATIONS"

# Check if max iterations reached
if [[ $CURRENT_ITERATION -gt $MAX_ITERATIONS ]]; then
    log "Max iterations ($MAX_ITERATIONS) reached. Stopping loop."
    log "Product building incomplete. Consider:"
    log "  1. Increasing max iterations"
    log "  2. Breaking down into smaller phases"
    log "  3. Refining your prompt for better convergence"

    # Deactivate loop
    sed -i "" "s/active: true/active: false/" "$STATE_FILE" 2>/dev/null || sed -i "s/active: true/active: false/" "$STATE_FILE"
    exit 0  # Allow exit
fi

# Function to parse TESTLOG.md and count bugs
parse_testlog() {
    if [[ ! -f "$TESTLOG_FILE" ]]; then
        BUGS_OPEN_CRITICAL=0
        BUGS_OPEN_MEDIUM=0
        BUGS_OPEN_LOW=0
        return
    fi

    # Count bugs that are NOT marked as FIXED
    # Critical bugs: lines starting with "- [BUG-" under CRITICAL section, not containing "FIXED"
    BUGS_OPEN_CRITICAL=$(grep -A 1000 "### .*CRITICAL" "$TESTLOG_FILE" 2>/dev/null | grep -B 1000 "### " | head -n -1 | grep -c "^\- \[BUG-" | grep -v "FIXED" || echo "0")
    BUGS_OPEN_MEDIUM=$(grep -A 1000 "### .*MEDIUM" "$TESTLOG_FILE" 2>/dev/null | grep -B 1000 "### " | head -n -1 | grep -c "^\- \[BUG-" | grep -v "FIXED" || echo "0")
    BUGS_OPEN_LOW=$(grep -A 1000 "### .*LOW" "$TESTLOG_FILE" 2>/dev/null | grep -B 1000 "### " | head -n -1 | grep -c "^\- \[BUG-" | grep -v "FIXED" || echo "0")

    # More robust counting - count lines with [BUG- that don't have FIXED
    BUGS_OPEN_CRITICAL=$(grep -E "^\- \[BUG-[0-9]+\]" "$TESTLOG_FILE" 2>/dev/null | grep -v "FIXED" | wc -l | tr -d ' ' || echo "0")

    # Simple approach: count all unfixed bugs in each section
    local in_critical=0 in_medium=0 in_low=0
    BUGS_OPEN_CRITICAL=0
    BUGS_OPEN_MEDIUM=0
    BUGS_OPEN_LOW=0

    while IFS= read -r line; do
        if [[ "$line" =~ "CRITICAL" ]]; then
            in_critical=1; in_medium=0; in_low=0
        elif [[ "$line" =~ "MEDIUM" ]]; then
            in_critical=0; in_medium=1; in_low=0
        elif [[ "$line" =~ "LOW" ]]; then
            in_critical=0; in_medium=0; in_low=1
        elif [[ "$line" =~ "PASSED" ]] || [[ "$line" =~ "Coverage" ]]; then
            in_critical=0; in_medium=0; in_low=0
        elif [[ "$line" =~ ^\-\ \[BUG- ]] && [[ ! "$line" =~ "FIXED" ]]; then
            if [[ $in_critical -eq 1 ]]; then
                BUGS_OPEN_CRITICAL=$((BUGS_OPEN_CRITICAL + 1))
            elif [[ $in_medium -eq 1 ]]; then
                BUGS_OPEN_MEDIUM=$((BUGS_OPEN_MEDIUM + 1))
            elif [[ $in_low -eq 1 ]]; then
                BUGS_OPEN_LOW=$((BUGS_OPEN_LOW + 1))
            fi
        fi
    done < "$TESTLOG_FILE"

    # Count fixed bugs
    BUGS_FIXED_TOTAL=$(grep -c "FIXED" "$TESTLOG_FILE" 2>/dev/null || echo "0")
}

# Check for completion promise in recent output
if [[ -n "$COMPLETION_PROMISE" ]]; then
    # Check git log for the completion promise
    if git log -1 --pretty=%B 2>/dev/null | grep -q "$COMPLETION_PROMISE"; then

        # If tester is enabled, check for critical bugs before allowing completion
        if [[ "$WITH_TESTER" == "true" ]]; then
            parse_testlog

            if [[ $BUGS_OPEN_CRITICAL -gt 0 ]]; then
                log "Completion promise found BUT $BUGS_OPEN_CRITICAL critical bugs are still open!"
                log "Cannot complete until all critical bugs are fixed."
                log "Forcing another iteration to fix critical bugs..."
                # Don't exit, continue with builder to fix bugs
            else
                log "Completion promise found: '$COMPLETION_PROMISE'"
                log "No critical bugs open. Product building complete! 🎉"

                # Deactivate loop
                sed -i "" "s/active: true/active: false/" "$STATE_FILE" 2>/dev/null || sed -i "s/active: true/active: false/" "$STATE_FILE"

                # Create completion report with QA stats
                create_completion_report
                exit 0  # Allow exit
            fi
        else
            log "Completion promise found: '$COMPLETION_PROMISE'"
            log "Product building complete! 🎉"

            # Deactivate loop
            sed -i "" "s/active: true/active: false/" "$STATE_FILE" 2>/dev/null || sed -i "s/active: true/active: false/" "$STATE_FILE"

            # Create completion report
            create_completion_report
            exit 0  # Allow exit
        fi
    fi
fi

# Function to create completion report
create_completion_report() {
    REFLECTION_INFO=""
    if [[ "$REFLECTION_ENABLED" == "true" ]]; then
        REFLECTION_INFO="
## Reflection Mode

- **Reflection**: Enabled
- **Checkpoint Interval**: $CHECKPOINT_INTERVAL iterations
- **Total Checkpoints**: $((CURRENT_ITERATION / CHECKPOINT_INTERVAL))
- **Last Checkpoint**: $(get_value 'last_checkpoint_at')

See ITERATION-LOG.md and CHECKPOINT-REPORT.md for detailed progress history.
"
    fi

    QA_INFO=""
    if [[ "$WITH_TESTER" == "true" ]]; then
        parse_testlog
        QA_INFO="
## QA Tester Results

- **Test Sweeps Completed**: $TEST_SWEEPS_COMPLETED
- **Bugs Fixed Total**: $BUGS_FIXED_TOTAL
- **Final Bug Count**:
  - Critical: $BUGS_OPEN_CRITICAL
  - Medium: $BUGS_OPEN_MEDIUM
  - Low: $BUGS_OPEN_LOW

See TESTLOG.md for detailed test history.
"
    fi

    cat > ".product-maker/completion-report.md" <<EOF
# Product Maker - Completion Report

**Completion Time**: $(date)
**Total Iterations**: $CURRENT_ITERATION
**Status**: SUCCESS ✅
$REFLECTION_INFO
$QA_INFO
## Completion Criteria Met

- Completion promise detected: \`$COMPLETION_PROMISE\`

## Final State

$(git log -1 --pretty=fuller)

## Next Steps

1. Review the built product
2. Run manual tests
3. Deploy to production if not already done
4. Archive this completion report

## Prompt Used

\`\`\`
$PROMPT
\`\`\`

---
Generated by Product Maker Plugin
EOF

    log "Completion report created: .product-maker/completion-report.md"
}

# Determine if this is a checkpoint iteration (reflection mode)
IS_CHECKPOINT=0
if [[ "$REFLECTION_ENABLED" == "true" ]] && [[ $CHECKPOINT_INTERVAL -gt 0 ]]; then
    if [[ $((CURRENT_ITERATION % CHECKPOINT_INTERVAL)) -eq 0 ]]; then
        IS_CHECKPOINT=1
    fi
fi

# Calculate next checkpoint iteration
NEXT_CHECKPOINT=$((CURRENT_ITERATION + CHECKPOINT_INTERVAL - (CURRENT_ITERATION % CHECKPOINT_INTERVAL)))
if [[ $NEXT_CHECKPOINT -gt $MAX_ITERATIONS ]]; then
    NEXT_CHECKPOINT=$MAX_ITERATIONS
fi

# Determine current role for this iteration (builder vs tester)
NEXT_ROLE="builder"
IS_TEST_ITERATION=0

if [[ "$WITH_TESTER" == "true" ]]; then
    # Check if this should be a test iteration based on TEST_EVERY
    if [[ $((CURRENT_ITERATION % TEST_EVERY)) -eq 0 ]]; then
        IS_TEST_ITERATION=1
        NEXT_ROLE="tester"
        log "This is a TESTER iteration (every $TEST_EVERY iterations)"
    else
        NEXT_ROLE="builder"
        log "This is a BUILDER iteration"
    fi

    # Parse current bug counts
    parse_testlog
    log "Current bugs - Critical: $BUGS_OPEN_CRITICAL, Medium: $BUGS_OPEN_MEDIUM, Low: $BUGS_OPEN_LOW, Fixed: $BUGS_FIXED_TOTAL"
fi

# Build the enhanced prompt based on role and mode
ENHANCED_PROMPT="$PROMPT"

if [[ "$WITH_TESTER" == "true" ]]; then
    if [[ "$IS_TEST_ITERATION" -eq 1 ]]; then
        # TESTER ITERATION
        TEST_SWEEPS_COMPLETED=$((TEST_SWEEPS_COMPLETED + 1))
        LAST_TEST_SWEEP=$CURRENT_ITERATION

        ENHANCED_PROMPT='You are a SENIOR QA ENGINEER. You are NOT a developer. Do NOT write new features, do NOT refactor code, do NOT "improve" anything.

Your ONLY job is to BREAK this application. You must be adversarial and thorough.

TESTING CHECKLIST:
1. Run ALL existing tests: `npm test` or equivalent
2. For each API endpoint:
   - Send empty body
   - Send wrong types (string where number expected, etc.)
   - Send extremely long strings (10000+ chars)
   - Send special characters and SQL injection attempts
   - Test without auth token
   - Test with expired/invalid auth token
   - Test with wrong user'"'"'s token (authorization, not just authentication)
3. For each form/UI component:
   - Submit empty
   - Submit with spaces only
   - Submit with XSS payloads
   - Test rapid double-submit
   - Test with JavaScript disabled (if applicable)
4. For each database operation:
   - Check for N+1 queries
   - Test with concurrent requests
   - Verify cascade deletes work correctly
5. General:
   - Check all environment variables are validated on startup
   - Verify error messages don'"'"'t leak stack traces or internal info
   - Check that all routes have proper error handling
   - Verify CORS configuration
   - Check for hardcoded secrets or credentials

IMPORTANT RULES:
- Write ALL findings to TESTLOG.md using the exact format specified below
- Assign severity levels honestly: CRITICAL = app crashes or data loss, MEDIUM = bad UX or wrong behavior, LOW = cosmetic or minor
- In the PASSED section, list everything that IS working correctly
- Include the Coverage section with actual test results
- Commit TESTLOG.md with message "test-sweep: iteration '"$CURRENT_ITERATION"' - found {X} critical, {Y} medium, {Z} low bugs"
- Do NOT fix any bugs yourself. Only document them.
- If previous TESTLOG.md exists, keep the history and add a new section at the TOP of the file

TESTLOG.md FORMAT:
```markdown
## Test Sweep - Iteration '"$CURRENT_ITERATION"' - '"$(date '+%Y-%m-%d %H:%M:%S')"'

### CRITICAL (bloqueantes)
- [BUG-XXX] Description of the bug
  - Steps to reproduce: ...
  - Expected: ...
  - Actual: ...
  - File: path/to/file.ts:line

### MEDIUM (deben arreglarse)
- [BUG-XXX] Description
  - Steps to reproduce: ...
  - Expected: ...
  - Actual: ...

### LOW (nice to fix)
- [BUG-XXX] Description

### PASSED
- List of what works correctly

### Coverage
- Tests executed: X
- Tests passing: Y
- Tests failing: Z
- Coverage estimated: N%
```

ORIGINAL PRODUCT REQUIREMENTS (for context only - DO NOT BUILD):
'"$PROMPT"'

Now perform your test sweep and document ALL findings in TESTLOG.md.'

    else
        # BUILDER ITERATION
        BUILDER_PREFIX='BEFORE building any new features, you MUST:
1. Check if TESTLOG.md exists
2. If it does, read the MOST RECENT test sweep section
3. Fix ALL items marked as CRITICAL first
4. Then fix items marked as MEDIUM
5. For each fix, update the item in TESTLOG.md to: FIXED (commit: <short-hash>)
6. Run tests to verify your fixes don'"'"'t break anything else
7. ONLY THEN continue with new features from the PRD

If you cannot fix a CRITICAL bug, add a comment explaining why and flag it as BLOCKED with your reasoning.

Current bug status:
- CRITICAL bugs open: '"$BUGS_OPEN_CRITICAL"'
- MEDIUM bugs open: '"$BUGS_OPEN_MEDIUM"'
- LOW bugs open: '"$BUGS_OPEN_LOW"'
- Total bugs fixed: '"$BUGS_FIXED_TOTAL"'

---

'
        ENHANCED_PROMPT="$BUILDER_PREFIX$PROMPT"

        # Add iteration info if reflection is enabled
        if [[ "$REFLECTION_ENABLED" == "true" ]]; then
            if [[ "$IS_CHECKPOINT" -eq 1 ]]; then
                ENHANCED_PROMPT="$ENHANCED_PROMPT

CHECKPOINT ITERATION $CURRENT_ITERATION - Perform FULL VALIDATION after fixing bugs and building features."
            else
                ENHANCED_PROMPT="$ENHANCED_PROMPT

ITERATION $CURRENT_ITERATION (Next checkpoint: iteration $NEXT_CHECKPOINT)"
            fi
        fi
    fi
else
    # Original behavior without tester
    if [[ "$REFLECTION_ENABLED" == "true" ]]; then
        if [[ "$IS_CHECKPOINT" -eq 1 ]]; then
            # CHECKPOINT ITERATION - Full validation
            log "CHECKPOINT iteration $CURRENT_ITERATION - triggering full validation"

            ENHANCED_PROMPT="$PROMPT

CHECKPOINT ITERATION $CURRENT_ITERATION

IGNORE ITERATION-LOG.md for this iteration. Perform FULL VALIDATION:

1. Run ALL tests and report results
2. Review ALL code files for:
   - Security vulnerabilities
   - Performance issues
   - Code quality problems
   - Incomplete implementations
3. Check ALL integrations are working
4. Verify ALL features from original prompt

Create/Update CHECKPOINT-REPORT.md with:
- Full test results
- All issues found
- Code quality assessment
- Integration status
- Top 3 priorities for next $CHECKPOINT_INTERVAL iterations

Then continue with normal development.
"
        else
            # NORMAL ITERATION - Use reflection log
            log "Reflection iteration $CURRENT_ITERATION (next checkpoint: $NEXT_CHECKPOINT)"

            ENHANCED_PROMPT="$PROMPT

ITERATION $CURRENT_ITERATION (Next checkpoint: iteration $NEXT_CHECKPOINT)

FIRST, read ITERATION-LOG.md to see:
- What was done in previous iterations
- Current test status
- Known blockers
- Next planned task

THEN:
1. Continue with the next logical task
2. Run tests related to your changes
3. Update ITERATION-LOG.md with:
   - Files you modified THIS iteration
   - Test results (passing/failing counts)
   - Any new blockers or issues
   - Next immediate task (1 sentence)

IMPORTANT:
- The log is a GUIDE, not a replacement for testing
- Always run tests to verify your changes
- Read full files when debugging
- Don't trust the log blindly - verify assumptions
"
        fi
    fi
fi

# Update state file with new iteration count and role tracking
LAST_CHECKPOINT_AT=$(get_value 'last_checkpoint_at')
if [[ "$IS_CHECKPOINT" -eq 1 ]]; then
    LAST_CHECKPOINT_AT="$(date -Iseconds)"
fi

cat > "$STATE_FILE" <<EOF
---
active: true
current_iteration: $CURRENT_ITERATION
max_iterations: $MAX_ITERATIONS
completion_promise: "$COMPLETION_PROMISE"
reflection_enabled: $REFLECTION_ENABLED
checkpoint_interval: $CHECKPOINT_INTERVAL
with_tester: $WITH_TESTER
test_every: $TEST_EVERY
current_role: "$NEXT_ROLE"
bugs_open_critical: $BUGS_OPEN_CRITICAL
bugs_open_medium: $BUGS_OPEN_MEDIUM
bugs_open_low: $BUGS_OPEN_LOW
bugs_fixed_total: $BUGS_FIXED_TOTAL
last_test_sweep: $LAST_TEST_SWEEP
test_sweeps_completed: $TEST_SWEEPS_COMPLETED
started_at: "$(get_value 'started_at')"
last_iteration_at: "$(date -Iseconds)"
last_checkpoint_at: "$LAST_CHECKPOINT_AT"
---
$PROMPT
EOF

log "Continuing loop. Progress: $CURRENT_ITERATION/$MAX_ITERATIONS (Role: $NEXT_ROLE)"

# Block exit and feed enhanced prompt back to Claude
# Exit code 2 tells Claude Code to continue with the prompt from the state file
echo "$ENHANCED_PROMPT"
exit 2
