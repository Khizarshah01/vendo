# @vendoai/cli

The `vendo` command. It reads your app, writes the Vendo wiring, and keeps the
extracted tools, theme and baselines in step with your code as it changes.

```bash
npm install -D @vendoai/cli
npx vendo init
```

This package owns the `vendo` bin. It used to ship inside `@vendoai/vendo`, so
installing the library alone no longer gives you the command — install this one
alongside it. Before anything is installed at all, `npx vendoai@latest init`
runs the CLI straight from npm.

`init` wires the handler, extracts tools and theme, and resolves a model key.
`doctor` verifies an install from the files on disk. `sync` re-extracts and
judges what moved — and it is what the `predev` and `prebuild` hooks init adds
to your `package.json` run, which is why the CLI stays installed rather than
being run once. `login`, `cloud`, `config`, `knowledge` and `mcp` cover the
Vendo Cloud key, the config layers, the product knowledge base, and the MCP
registry and domain-verification files.

A dev dependency is the right home: every command above runs at development or
build time, never inside a request.

The extraction stages are importable as `@vendoai/cli/extract`.

Read the [quickstart](https://docs.vendo.run/quickstart) and the
[CLI reference](https://docs.vendo.run/reference/cli).
