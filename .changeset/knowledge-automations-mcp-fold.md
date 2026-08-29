---
"@vendoai/core": minor
"@vendoai/vendo": minor
---

**Three blocks fold into `@vendoai/vendo`. `@vendoai/knowledge`,
`@vendoai/automations` and `@vendoai/mcp` are gone.**

Pre-1.0 hard cut, no alias packages. Each block's public surface survives
unchanged — the same barrel, the same symbols — at a subpath of the umbrella,
so a migration is a specifier rewrite and nothing else:

- `@vendoai/automations` → `@vendoai/vendo/automations`
- `@vendoai/mcp` → `@vendoai/vendo/mcp`
- `@vendoai/knowledge` → `@vendoai/vendo/knowledge`

The umbrella ROOT is unchanged. It already re-exported the handful of names a
host actually composes with — `AutomationsEngine`, `RunRecord`, `RunStatus`,
`RunPlan`, `HostOAuthAdapter`, `UNATTENDED_IRREVERSIBILITY_RULE` — and it still
does, from the same place. Nothing was added to it, and the door's surface
beyond `HostOAuthAdapter` stays umbrella-internal exactly as before.

**Two constants move to `@vendoai/core` instead.**
`KNOWLEDGE_DOCS_COLLECTION` and `KNOWLEDGE_CHUNKS_COLLECTION` are released
store-collection names, not engine logic — a second repo is written against
these literals to keep its own tables out of their way. They are contract, so
they now ship from `@vendoai/core`, beside the `KnowledgeDoc` shape and the
engine-collection registry that already named both strings. Import them from
`@vendoai/core`; `@vendoai/vendo/knowledge` re-exports them too, so either
works.

**What a host installs.** `@vendoai/vendo` now depends directly on `croner`,
`jsonata`, `jose` and `@modelcontextprotocol/sdk`, which the three blocks
brought in before — the install graph is unchanged, the packages that declare
them moved.

No behaviour changes. Every symbol keeps its signature, and the one
type-level edit the fold forced (the umbrella compiles with the DOM lib, whose
`BufferSource` is narrower) is internal to webhook verification and changes no
published signature.
