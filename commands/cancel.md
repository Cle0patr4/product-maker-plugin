# /product-maker:cancel

Cancel the active product-maker loop.

## Usage

```bash
/product-maker:cancel
```

This command:
1. Removes the `.product-maker-state.yaml` file
2. Stops the loop on the next iteration
3. Preserves all code and commits made so far

## Note

The current iteration will complete before the loop stops. Any in-progress work will be committed if possible.

## Resuming

To resume building after canceling, simply run `/product-maker:build-product` again with your updated prompt.
