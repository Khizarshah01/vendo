---
"@vendoai/vendo": patch
---

**The store's migration guards ask about the CURRENT schema.** Three steps in
`ensureSchema` asked `information_schema` whether a column existed without
scoping the question to `current_schema()`. `information_schema` shows every
schema the role can see, so on a Postgres holding more than one Vendo
deployment — different schemas in one database, an ordinary bring-your-own
shape — a *sibling* deployment's pre-migration table could answer for yours.
The guard fired, the body ran against `search_path`, and boot failed with
`column t.messages does not exist`. The `vendo_runs` step is the sharp one: it
`DELETE`s before it `ALTER`s. Each guard now carries
`AND table_schema = current_schema()`, matching the v12 step that already did.
