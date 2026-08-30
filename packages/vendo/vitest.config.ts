import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // The two toolchains want two compilers in one process. The Node one
    // resolves `typescript` through `createRequire`, which no bundler alias can
    // touch, so it keeps getting the 5.x devDependency; the edge one IMPORTS
    // `typescript`, and its peer range is exactly 6.0.3 — the version its
    // vendored lib files were copied from. Anchored, so `typescript-eslint` and
    // friends are not rewritten by prefix. (Arrived with the apps fold, S11d;
    // scripts/portability-gate.mjs's edge leg aliases the same pair.)
    alias: [{ find: /^typescript$/, replacement: "typescript-6" }],
  },
  test: {
    // Worker caps live in config, not in the root `test` scripts: a cap in a
    // command line only applies when someone types that command, so a bare
    // `npx vitest`, an IDE runner and a debug run all escaped it. Env
    // (VITEST_MIN/MAX_FORKS, VITEST_MIN/MAX_THREADS) still wins, so CI is
    // unchanged. Both halves are required: vitest 2.1 defaults the min to the
    // CPU count independently of the max, and a max-only cap makes Tinypool
    // throw `minThreads and maxThreads must not conflict` before any test runs.
    poolOptions: {
      forks: { minForks: 1, maxForks: 2 },
      threads: { minThreads: 1, maxThreads: 2 },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.test-util.{ts,tsx}"],
      // Ratcheted line-coverage floor (ENG-255): set at/just below the measured
      // value so it can only rise. Regression below this fails CI.
      //
      // The two globs are the app-generation code S11d folded in. A fold must
      // not weaken a gate as a side effect, and a single umbrella number would
      // have: that code carried its own floor of 88 as @vendoai/apps, and
      // averaging it into 78 would have retired 10 points nobody chose to give
      // up. Files matched by a glob are held to the glob and excluded from the
      // number above, so each half still answers for itself.
      //
      // Off inside a shard, which sees a fraction of the files: coverage-merge
      // replays the blobs and enforces these against the whole suite. This gate
      // lives here rather than in a CLI override because
      // `--coverage.thresholds.lines=0` reaches only the top-level key — the
      // per-glob entries kept their 88 and reddened all eight shards the day
      // S11d added them, with every test passing.
      thresholds: process.env.VITEST_SHARD
        ? {}
        : {
            lines: 78,
            "src/apps/**": { lines: 88 },
            "src/sandbox/**": { lines: 88 },
          },
    },
    environment: "node",
    // No real telemetry from tests (see vitest.setup.ts).
    setupFiles: ["./vitest.setup.ts"],
    // Every umbrella test composes the full stack (createVendo → real PGlite
    // store + agent + guard + apps + automations) and, for the wire tests,
    // streams a turn end to end. Turbo runs this suite concurrently with every
    // other package's tests, so on a loaded CI runner these full-stack tests can
    // starve well past vitest's 5s default (≈11s local, ≈90s for the suite under
    // CI contention). 30s absorbs the contention without masking a real hang.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
