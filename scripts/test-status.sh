#!/bin/bash
# Product Maker Test Status Script
# Parses TESTLOG.md and shows a summary of QA status

set -euo pipefail

STATE_FILE=".product-maker-state.yaml"
TESTLOG_FILE="TESTLOG.md"

# Parse YAML value
get_value() {
    local key=$1
    grep "^$key:" "$STATE_FILE" 2>/dev/null | sed "s/^$key: *//" | sed 's/^"//' | sed 's/"$//' || echo ""
}

echo ""
echo "Product Maker - Test Status"
echo "================================"
echo ""

# Check if state file exists
if [[ ! -f "$STATE_FILE" ]]; then
    echo "No active product-maker loop found."
    echo "Start a build with: /product-maker:build-product"
    exit 0
fi

# Check if tester is enabled
WITH_TESTER=$(get_value "with_tester")
if [[ "$WITH_TESTER" != "true" ]]; then
    echo "QA Tester mode is disabled for this build."
    echo "Use --with-tester to enable it."
    exit 0
fi

# Check if TESTLOG.md exists
if [[ ! -f "$TESTLOG_FILE" ]]; then
    echo "No TESTLOG.md found yet."
    echo "The tester will create it on the first test sweep iteration."
    echo ""
    CURRENT_ITERATION=$(get_value "current_iteration")
    TEST_EVERY=$(get_value "test_every")
    NEXT_TEST=$((TEST_EVERY - (CURRENT_ITERATION % TEST_EVERY)))
    if [[ $NEXT_TEST -eq $TEST_EVERY ]]; then
        NEXT_TEST=0
    fi
    echo "Current iteration: $CURRENT_ITERATION"
    echo "Next test sweep in: $NEXT_TEST iterations"
    exit 0
fi

# Parse TESTLOG.md and count bugs
BUGS_OPEN_CRITICAL=0
BUGS_OPEN_MEDIUM=0
BUGS_OPEN_LOW=0
BUGS_FIXED=0

in_critical=0
in_medium=0
in_low=0

while IFS= read -r line; do
    if [[ "$line" =~ "CRITICAL" ]]; then
        in_critical=1; in_medium=0; in_low=0
    elif [[ "$line" =~ "MEDIUM" ]]; then
        in_critical=0; in_medium=1; in_low=0
    elif [[ "$line" =~ "LOW" ]]; then
        in_critical=0; in_medium=0; in_low=1
    elif [[ "$line" =~ "PASSED" ]] || [[ "$line" =~ "Coverage" ]]; then
        in_critical=0; in_medium=0; in_low=0
    elif [[ "$line" =~ ^\-\ \[BUG- ]]; then
        if [[ "$line" =~ "FIXED" ]]; then
            BUGS_FIXED=$((BUGS_FIXED + 1))
        else
            if [[ $in_critical -eq 1 ]]; then
                BUGS_OPEN_CRITICAL=$((BUGS_OPEN_CRITICAL + 1))
            elif [[ $in_medium -eq 1 ]]; then
                BUGS_OPEN_MEDIUM=$((BUGS_OPEN_MEDIUM + 1))
            elif [[ $in_low -eq 1 ]]; then
                BUGS_OPEN_LOW=$((BUGS_OPEN_LOW + 1))
            fi
        fi
    fi
done < "$TESTLOG_FILE"

# Get state info
LAST_TEST_SWEEP=$(get_value "last_test_sweep")
TEST_SWEEPS_COMPLETED=$(get_value "test_sweeps_completed")
CURRENT_ITERATION=$(get_value "current_iteration")
TEST_EVERY=$(get_value "test_every")

# Display results
if [[ $BUGS_OPEN_CRITICAL -gt 0 ]]; then
    echo "  CRITICAL: $BUGS_OPEN_CRITICAL open"
else
    echo "  CRITICAL: 0 open"
fi

if [[ $BUGS_OPEN_MEDIUM -gt 0 ]]; then
    echo "  MEDIUM: $BUGS_OPEN_MEDIUM open"
else
    echo "  MEDIUM: 0 open"
fi

if [[ $BUGS_OPEN_LOW -gt 0 ]]; then
    echo "  LOW: $BUGS_OPEN_LOW open"
else
    echo "  LOW: 0 open"
fi

echo "  FIXED: $BUGS_FIXED total"
echo ""
echo "Last test sweep: Iteration $LAST_TEST_SWEEP"
echo "Test sweeps completed: $TEST_SWEEPS_COMPLETED"
echo ""

# Calculate next test sweep
NEXT_TEST=$((TEST_EVERY - (CURRENT_ITERATION % TEST_EVERY)))
if [[ $NEXT_TEST -eq $TEST_EVERY ]]; then
    NEXT_TEST=0
fi
if [[ $NEXT_TEST -gt 0 ]]; then
    echo "Next test sweep in: $NEXT_TEST iterations"
    echo ""
fi

# Status message
if [[ $BUGS_OPEN_CRITICAL -gt 0 ]]; then
    echo "Status: BLOCKED - Fix $BUGS_OPEN_CRITICAL critical bug(s) before completion"
elif [[ $BUGS_OPEN_MEDIUM -gt 0 ]]; then
    echo "Status: Ready for completion (but $BUGS_OPEN_MEDIUM medium bugs remain)"
else
    echo "Status: Ready for completion (no critical bugs)"
fi
echo ""
