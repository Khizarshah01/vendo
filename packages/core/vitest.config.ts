import { defineConfig } from "vitest/config";

export default defineConfig({
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
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.test-util.{ts,tsx}"],
      // Ratcheted line-coverage floor (ENG-255): set at/just below the measured
      // value so it can only rise. Regression below this fails CI.
      //
      // 97 -> 94 at S11d, and this IS a real drop: the app-generation contract
      // folded in at 88.87% over 3,118 lines against core's own 97.54% over
      // 7,411, so the merged number is 94.97. A glob threshold does NOT exclude
      // its files from the global one — both apply — so there is no arrangement
      // of two numbers that holds core's own code at 97 without also demanding
      // 97 from code that never met it.
      //
      // The glob is still worth having: it stops the folded half from drifting
      // BELOW the 88 it arrived with, which a single 94 would happily allow.
      // Re-ratcheting the global needs the merged number from a full sharded
      // run — the same follow-up guard 96, store 84, actions 90 and telemetry
      // 95 are already queued behind.
      thresholds: {
        lines: 94,
        "src/apps/**": { lines: 88 },
      },
    },
  },
});
