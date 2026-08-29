#!/usr/bin/env node
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
// The CLI is its own published package now (S10); the alias keeps the `vendo`
// bin so `npx vendoai@latest …` still works and hops to the canonical one.
const rootEntry = require.resolve("@vendoai/cli");
const canonicalBin = new URL("../bin/vendo.mjs", pathToFileURL(rootEntry));
await import(canonicalBin.href);
