#!/usr/bin/env node
// Thin shebang entry. All logic lives in dist/cli.js.
import { main } from '../dist/cli.js';

main(process.argv).then((code) => {
  if (code !== 0) process.exit(code);
});
