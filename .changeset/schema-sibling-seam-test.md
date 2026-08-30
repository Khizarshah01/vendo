---
---

No published behaviour changes: a regression test only. It pins the seam that let
three cross-schema migration guards ship — a sibling schema in the same database,
which is both an ordinary bring-your-own-Postgres shape and what the store test
harness already does, and which neither repo tested.
