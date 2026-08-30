---
"@vendoai/core": minor
"@vendoai/vendo": minor
"@vendoai/cli": minor
---

**`@vendoai/store`, `@vendoai/actions` and `@vendoai/telemetry` fold into
`@vendoai/vendo`; the store's routed collection names move to `@vendoai/core`.**
`@vendoai/store` and `@vendoai/actions` stay published at 0.57.0 and
`@vendoai/telemetry` at 0.6.0, their last releases — nothing you already
installed stops working.

Every symbol keeps the exact surface it had. Each block's own barrel is
republished whole at a subpath of the umbrella, so a migration is a specifier
rewrite and nothing else:

| was | is |
| --- | --- |
| `@vendoai/store` | `@vendoai/vendo/store` |
| `@vendoai/store/postgres` | `@vendoai/vendo/store/postgres` |
| `@vendoai/store/test-util` | `@vendoai/vendo/store/test-util` |
| `@vendoai/actions` | `@vendoai/vendo/actions` |
| `@vendoai/actions/presets` | `@vendoai/vendo/actions/presets` |
| `@vendoai/actions/presets/auth-js` | `@vendoai/vendo/actions/presets/auth-js` |
| `@vendoai/actions/sync` | `@vendoai/vendo/actions/sync` |
| `@vendoai/telemetry` | `@vendoai/vendo/telemetry` |

`@vendoai/vendo/telemetry` keeps the `workerd` / `worker` / `edge-light` /
`browser` conditions the old root export carried, so an edge build still gets
the no-op client rather than the Node one.

**ONE LINE IN YOUR `next.config` CHANGES.** `serverExternalPackages` named
`@vendoai/store` because that package loads PGlite, and PGlite's Emscripten
module breaks under production chunking. The package that loads it is
`@vendoai/vendo` now:

```ts
serverExternalPackages: ["@vendoai/apps", "esbuild", "@electric-sql/pglite", "@vendoai/vendo"],
```

`vendo init` writes the new line and `vendo doctor` checks for it
([`E-CFG-004`](https://docs.vendo.run/production/troubleshooting/e-cfg-004)).
An existing host keeping the old entry loses the containment, so update it.

**Three names are now `@vendoai/core`'s**, because a contract a second process
reads must be declared once: `RESERVED_COLLECTIONS`,
`DEDICATED_RECORD_COLLECTIONS` and the `ReservedCollection` type. Core already
spelled all thirteen of those collections as literals in
`ENGINE_COLLECTION_REGISTRY`, so the one spelling now sits beside the registry
that mirrors it. `@vendoai/vendo/store` re-exports all three, so an import
through the store barrel is unchanged. The engine's PRIVATE routing facts stay
with the engine: `RESERVED_CURSOR_COLUMNS` names physical columns, and
`ATOMIC_RESERVED_COLLECTIONS` is not exported at all.

Everything else is logic and stays in the umbrella — `createStore`,
`createStoreOps`, `hostedStore`, the workspace and erase surfaces, the
`ActionsRegistry` runtime, the connectors, `vendoSync` and the presets.

`@vendoai/vendo` absorbs the runtime dependencies the three blocks brought with
them (`@electric-sql/pglite`, `pg`, `aws4fetch`, `yaml`) and the actions block's
optional `next` peer. Its own `@electric-sql/pglite` devDependency was `^0.2.0`
and the store's dependency was `^0.5.4`; the umbrella takes `^0.5.4`, the one
the store engine is written against.

One wire-visible string: the MCP connector's `clientInfo.name` said
`@vendoai/actions`, a package that no longer exists. It says `@vendoai/vendo`.
