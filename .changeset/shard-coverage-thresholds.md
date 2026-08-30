---
---

No published behaviour changes: the per-shard CI runs stopped enforcing coverage
floors they cannot measure. A shard covers a fraction of the files, so its number
is not the floor — `coverage-merge` is where the floor is real. The old
neutraliser, `--coverage.thresholds.lines=0`, reached only the top-level key, so
the per-glob floors added with the apps fold went on being enforced per shard and
reddened all eight vendo shards with every test passing.
