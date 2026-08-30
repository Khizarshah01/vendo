import type { NextConfig } from "next";
import { BASE_PATH } from "./src/lib/base-path";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Served in place at demos.vendo.run/maple — see ./src/lib/base-path.
  basePath: BASE_PATH,
  // PGlite's Emscripten module breaks under Turbopack's production chunking
  // ("f.instantiateWasm is not a function"), so it is named here. `esbuild` is
  // the checker's, and it is only reachable through a VARIABLE specifier the
  // bundler cannot see — the entry is what keeps a static resolve out, and the
  // monorepo root hoists the binary for the runtime one.
  //
  // @vendoai/vendo is deliberately ABSENT, and unconditionally so.
  // `serverExternalPackages` is package-granular and the umbrella has a
  // "use client" half, so listing it hands Next the client doors through the
  // server condition and prerender dies on a null React dispatcher.
  serverExternalPackages: ["esbuild", "@electric-sql/pglite"],
  // Dev-only: resolve the whole @vendoai workspace graph to its TypeScript
  // source so edits anywhere in packages/*/src hot-reload here instead of
  // waiting on a `pnpm build`. Turbopack matches the request verbatim, so
  // every entry point in every package's exports map needs its own line — and
  // their NodeNext `.js` specifiers only resolve to `.ts` because this app's
  // tsconfig is NodeNext too. Whole graph or nothing, deliberately: aliasing
  // only part of it leaves one bundle holding a src copy and a dist copy of
  // the same module, and state keyed by module identity (harnesses' WeakMap of
  // adapter slots, store's of internals) then splits silently across the two.
  // An externalized package must not stay aliased here: Turbopack HARD-FATALS on
  // a package named in BOTH transpilePackages and serverExternalPackages, which
  // is exactly why @vendoai/vendo's entry above is dev-conditional. `next build`
  // skips this block entirely and resolves dist/ like a published install would.
  //
  // Production transpiles the umbrella too, which is the same thing this branch
  // always did for the ui package — the two are one now, and with the umbrella
  // off the externals list above there is no list for it to collide with.
  ...(process.env.NODE_ENV === "development"
    ? {
        transpilePackages: ["@vendoai/vendo"],
        turbopack: {
          resolveAlias: {
            "@vendoai/vendo/core": "../../packages/vendo/src/core/index.ts",
            "@vendoai/vendo/core/conformance": "../../packages/vendo/src/core/conformance/index.ts",
            "@vendoai/vendo/core/apps": "../../packages/vendo/src/core/apps/index.ts",
            "@vendoai/vendo/ui": "../../packages/vendo/src/ui/index.ts",
            "@vendoai/vendo/ui/chrome": "../../packages/vendo/src/ui/chrome/index.ts",
            "@vendoai/vendo/ui/tree": "../../packages/vendo/src/ui/tree/index.ts",
            "@vendoai/vendo/ui/kit": "../../packages/vendo/src/ui/kit/index.ts",
            "@vendoai/vendo": "../../packages/vendo/src/index.ts",
            "@vendoai/vendo/server": "../../packages/vendo/src/server.ts",
            "@vendoai/vendo/apps": "../../packages/vendo/src/apps/index.ts",
            "@vendoai/vendo/apps/testing": "../../packages/vendo/src/apps/testing/index.ts",
            "@vendoai/vendo/sandbox/e2b": "../../packages/vendo/src/sandbox/escalation/e2b/index.ts",
            "@vendoai/vendo/sandbox/edge": "../../packages/vendo/src/sandbox/edge/index.ts",
            "@vendoai/vendo/store": "../../packages/vendo/src/store/index.ts",
            "@vendoai/vendo/store/postgres": "../../packages/vendo/src/store/postgres.ts",
            "@vendoai/vendo/store/test-util": "../../packages/vendo/src/store/fake-console.ts",
            "@vendoai/vendo/actions": "../../packages/vendo/src/actions/index.ts",
            "@vendoai/vendo/actions/presets": "../../packages/vendo/src/actions/presets/index.ts",
            "@vendoai/vendo/actions/presets/auth-js": "../../packages/vendo/src/actions/presets/auth-js.ts",
            "@vendoai/vendo/actions/sync": "../../packages/vendo/src/actions/sync/public.ts",
            "@vendoai/vendo/telemetry": "../../packages/vendo/src/telemetry/index.ts",
            "@vendoai/vendo/guard": "../../packages/vendo/src/guard/index.ts",
            "@vendoai/vendo/harnesses": "../../packages/vendo/src/harnesses/index.ts",
            "@vendoai/vendo/harnesses/vendo": "../../packages/vendo/src/harnesses/vendo/index.ts",
            "@vendoai/vendo/harnesses/claude-code": "../../packages/vendo/src/harnesses/claude-code/index.ts",
            "@vendoai/vendo/harnesses/claude-turn": "../../packages/vendo/src/harnesses/claude-code/claude-turn.ts",
            // No line for @vendoai/vendo/box-door: it ships as source
            // (box/turn-routes.mjs), so there is no dist copy to bypass.
            "@vendoai/vendo/extract": "../../packages/vendo/src/cli/extract/index.ts",
            "@vendoai/vendo/react": "../../packages/vendo/src/react.tsx",
            "@vendoai/vendo/ai-sdk": "../../packages/vendo/src/ai-sdk.ts",
            "@vendoai/vendo/mastra": "../../packages/vendo/src/mastra.ts",
            "@vendoai/vendo/auth/auth0": "../../packages/vendo/src/auth-presets/auth0.ts",
            "@vendoai/vendo/auth/auth-js": "../../packages/vendo/src/auth-presets/auth-js.ts",
            "@vendoai/vendo/auth/clerk": "../../packages/vendo/src/auth-presets/clerk.ts",
            "@vendoai/vendo/auth/jwt": "../../packages/vendo/src/auth-presets/jwt.ts",
            "@vendoai/vendo/auth/supabase": "../../packages/vendo/src/auth-presets/supabase.ts",
          },
        },
      }
    : { transpilePackages: ["@vendoai/vendo"] }),
  // Test boots (away-drill e2e) get their own dist dir → own dev-server lock,
  // so they never fight a concurrent `pnpm dev`. Nested under .next so
  // gitignore/scanner rules that skip .next cover it.
  ...(process.env.MAPLE_DIST_DIR ? { distDir: process.env.MAPLE_DIST_DIR } : {}),
  // Dev-only: allow the local TLS front (e.g. https://127.0.0.1:8443 for
  // broker-fronted MCP verification) to load dev resources; without this,
  // Next blocks cross-origin dev assets and pages served through the front
  // never hydrate. No effect on production builds.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
