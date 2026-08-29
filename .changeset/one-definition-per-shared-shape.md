---
"@vendoai/core": minor
"@vendoai/store": minor
"@vendoai/automations": minor
---

**Shared shapes get one definition, and the copies import it.**

Additive only — no exported type changes shape, and nothing published narrows.

`@vendoai/core` now exports the audit enums as tuples (`AUDIT_KINDS`,
`AUDIT_OUTCOMES`, `AUDIT_DECIDED_BY`, plus the `AuditKind` type). The audit ROW
schema, the `AuditEvent` interface and the store wire's audit REQUEST filters
were three hand-kept copies of the same member lists; they now build from these,
and from `VENUES`, which core already owned. The request keeps its own schema —
it must refuse a kind this build has not heard of rather than widen — it just no
longer keeps its own member list. `packages/core/tests/enum-single-source.test.ts`
asserts the same array OBJECT reached every schema, because two copies that
merely agree is exactly what a drifting duplicate passes.

`@vendoai/core` also exports `RUN_STATUSES` / `RunStatus` (from `automation.ts`)
and `meterExhaustedBodySchema` / `MeterExhaustedBody` (beside the
already-exported `METER_EXHAUSTED_CODE`). `@vendoai/automations` re-exports
`RunStatus` from core rather than declaring it — same four members, same
structural type, so no consumer changes.

`@vendoai/store` exports `RESERVED_CURSOR_COLUMNS`, the reserved collection →
age/keyset column map, so a mirror of the routing table reads it instead of
restating it. `RunRow["status"]` is unchanged and still accepts
`pending-approval` on top of the four; it is now spelled against `RUN_STATUSES`
so the shared four cannot drift from it.
