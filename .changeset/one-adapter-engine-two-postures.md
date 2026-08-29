---
"@vendoai/core": minor
"@vendoai/guard": patch
---

**One `engine`-over-adapter implementation, with the atomics posture as an option.**

`engineOverAdapter` takes an optional `{ atomics: "degrade" | "require" }`.
`degrade` stays the default and is what every existing caller already got: a
door without the optional `RecordStore.atomic` capability falls back to the
check-then-put those call sites used to hand-roll, so moving a block onto this
family never turns a working BYO adapter into a `not-implemented`.

Guard had its own private copy of the same seven verbs, and it disagreed with
core's in both directions: stricter on atomics — refusing rather than degrading,
because a read-then-write is not a single-use approval transition — and looser
on `engine.list`, handing a watermark to a `RecordStore.list` that has no
watermark in its query and answering with an ordinary newest-first page. That
second one turns a forward walk into a permanent re-read of the newest rows.

The copy is gone. Guard now composes core's with `atomics: "require"`, so its
approval transitions still fail closed exactly as on the hosted wire, and it
inherits core's watermark refusal — the only posture that moves, and it was
latent (guard passes no watermark anywhere; its one lister walks by cursor).
`mcp`, `knowledge`, `apps`, `automations` and `store` are unchanged.
