# /product-maker:test-status

Show the current QA test status from TESTLOG.md.

## Usage

```bash
/product-maker:test-status
```

## What It Shows

Parses TESTLOG.md and displays a summary:

```
Test Status:
  CRITICAL: 2 open
  MEDIUM: 5 open
  LOW: 3 open
  FIXED: 12 total
Last test sweep: Iteration 14
```

## When to Use

- Monitor QA progress during a product build
- Quick check before reviewing TESTLOG.md in detail
- Verify all critical bugs are fixed before completion

## Requirements

- Must be run in a directory with an active product-maker loop
- TESTLOG.md must exist (created by tester iterations)

## Related Commands

- `/product-maker:build-product` - Start building a product
- `/product-maker:cancel` - Cancel the active loop
- `/product-maker:help` - Show help

## Example Output

```
Product Maker - Test Status
================================

  CRITICAL: 0 open
  MEDIUM: 2 open
  LOW: 5 open
  FIXED: 8 total

Last test sweep: Iteration 12
Test sweeps completed: 6

Status: Ready for completion (no critical bugs)
```

Or if there are critical bugs:

```
Product Maker - Test Status
================================

  CRITICAL: 3 open
  MEDIUM: 7 open
  LOW: 2 open
  FIXED: 4 total

Last test sweep: Iteration 8
Test sweeps completed: 4

Status: BLOCKED - Fix 3 critical bugs before completion
```
