---
"@vendoai/vendo": minor
---

The standalone backend agent folds into `@vendoai/vendo`. `@vendoai/agents` is
gone: `agent()`, `tool()`, `api()`, `serve()`, `agentHandler`, `createUser`,
`createTurns`, `awayRunner`, `e2b`, `postgres`, `provideCloudAdapters` and the
rest now ship from the umbrella root, and the route runtime that was
`@vendoai/agents/http` is the one the umbrella's own wire already runs.

Pre-1.0 hard cut, no alias package. Change `@vendoai/agents` imports to
`@vendoai/vendo`, and `@vendoai/agents/claude-code` to
`@vendoai/vendo/claude-code`; every export name is unchanged but two.

`Turn` and `TurnResult` are the exception. Both halves claim those names and
they are not the same types — core's `Turn` is the Build-contract turn a
harness is handed, the agent surface's is the in-flight handle a caller holds —
so the umbrella root keeps the meaning it already had (core's). A host moving
off `@vendoai/agents` that named either one gets a compile error at its use
site rather than a silently different type; import the shape you need from the
module that defines it.

Boot errors that told you to import from `@vendoai/agents` now name
`@vendoai/vendo`, because the package they pointed at no longer resolves. This
affects the two sandbox errors in `agent()`, the `agent:` config-key error, and
the `createVendo({ agent })`, `createVendo({ agents })` and `serve({ agents })`
refusals.
