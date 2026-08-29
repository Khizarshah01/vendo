---
"@vendoai/core": minor
"@vendoai/guard": minor
"@vendoai/store": minor
---

**The drawers a guard writes, and the run-status acceptor, are exported for the
readers that live outside these packages.**

Additive only — nothing published narrows, and no exported type changes shape.

`@vendoai/guard` now exports `AUDIT_COLLECTION`, `APPROVALS_COLLECTION`,
`CONTROLS_COLLECTION`, `FREEZE_ROW` and `DEFAULT_PARKED_CALL_TTL_MS`. All five
were module-private, and the process that reads guard state most — Vendo Cloud's
console, which draws the audit feed and the approvals rail, and which FLIPS the
freeze row a guard in another process obeys on its next check — had spelled every
one of them again in its own literals. A reader's copy of a writer's collection
name is a seam that can only ever agree with itself: a rename here would have
shipped a Guard page that silently draws nothing, and an emergency stop that
silently does nothing.

`@vendoai/core` now declares `RUN_ROW_STATUSES` (and `RunRowStatus`) beside the
`RUN_STATUSES` it widens, and `@vendoai/store` re-exports it from its own surface:
it is the tuple `RunRow.status` was already built from — the engine's four plus `pending-approval`,
which no engine writes but `parseRunData` has accepted since before the ledger
dropped its waiting state. It is a tuple and not just a type because the readers
of this ledger are in other processes and validate query parameters against it at
runtime — a reader narrower than its writer refuses rows the store will happily
hold. `parseRunData`'s own five-way status check now reads the tuple instead of
being a third spelling of it.
