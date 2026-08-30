---
"@vendoai/core": minor
"@vendoai/vendo": minor
"@vendoai/ui": minor
"@vendoai/cli": minor
---

**`@vendoai/apps` splits in two and retires: its contract half is
`@vendoai/core`'s, its engine half is `@vendoai/vendo`'s.** The retired package
stays published at 0.58.0, its last release — nothing you already installed
stops working.

Every symbol keeps the exact surface it had. Each door is republished whole at a
subpath, so a migration is a specifier rewrite and nothing else:

| was                       | is                            |
| ------------------------- | ----------------------------- |
| `@vendoai/apps/contract`  | `@vendoai/core/apps`          |
| `@vendoai/apps`           | `@vendoai/vendo/apps`         |
| `@vendoai/apps/testing`   | `@vendoai/vendo/apps/testing` |
| `@vendoai/apps/e2b`       | `@vendoai/vendo/sandbox/e2b`  |
| `@vendoai/apps/edge`      | `@vendoai/vendo/sandbox/edge` |

Most hosts need no rewrite at all: `createVendo`, `AppsConfig`, `AppsRuntime`,
`EditResult`, `OpenSurface`, `SeedDrift`, `VersionEntry`, `SandboxAdapter` and
`SandboxMachine` were already re-exported from `@vendoai/vendo` and
`@vendoai/vendo/server`, and still are.

**The contract half is `@vendoai/core`'s** — the app format, the Kit, and the
browser-safe screen engine (`bootScreen`, `flattenTree`, `warmScreenEngine`,
`evaluateExpr`, `KIT_SPECS`, `VendoTheme`, and the rest of what
`@vendoai/apps/contract` exported). It moves because `@vendoai/ui` renders
generated screens through that door and may not depend on the umbrella; core is
the one package below both. `@vendoai/core/apps` is ESM-only, exactly as
`@vendoai/apps/contract` was — it reads `import.meta.url` and resolves its
WebAssembly through a package condition, neither of which CommonJS can carry, so
it has no `require` leg. The `.` and `./conformance` entries are unchanged and
still ship a CommonJS build.

`quickjs.wasm` — the screen engine's WebAssembly — now ships beside
`@vendoai/core`'s `dist` rather than `@vendoai/apps`'. A bundler that emits it
for you needs no change; a host that copies it by hand should copy it from the
new package.

**The engine half is `@vendoai/vendo`'s**: app generation, checking,
persistence, the runtime, the doors, the remix and automation authoring, and the
two sandbox venues. `escalation/` and `edge/` land under the sandbox feature,
which is why their subpaths are `/sandbox/e2b` and `/sandbox/edge` rather than
`/apps/*`.

**One user-visible configuration change.** `serverExternalPackages` no longer
needs `@vendoai/apps`: the checker that reaches esbuild through a bundler-blind
specifier is inside `@vendoai/vendo` now, which was already on the list. `vendo
init` writes the shorter line, `vendo doctor` checks it (E-CFG-004), and the
docs and example configs follow:

```js
serverExternalPackages: ["esbuild", "@electric-sql/pglite", "@vendoai/vendo"],
```

An existing config that still names `@vendoai/apps` keeps working — the entry is
inert once the package is gone — but `vendo doctor` will stop asking for it.

**One symbol is newly reachable.** `zodShape` (with `ZodKind` and `ZodShape`) is
exported from `@vendoai/core/apps`. It was package-internal before; the split
put its two callers in different packages, so the door is the only place they
can both reach it.
