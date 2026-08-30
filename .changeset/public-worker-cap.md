---
---

No published behaviour changes: the public CI shards and coverage-merge drop from
one vitest worker per core to two on a measured four-core runner, and the
temporary probe that measured it comes out. Workers equal to the core count
leaves nothing for the main thread they report to.
