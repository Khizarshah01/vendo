import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // --- vendo (1 line): keep @vendoai/vendo, esbuild (app generation's syntax
  // check) and PGlite + the store that loads it (persistence) out of the
  // bundler. @vendoai/vendo is the load-bearing entry — it reaches esbuild
  // through a variable specifier the bundler cannot see, so an "esbuild" entry
  // alone is inert and this only ever worked because the monorepo root hoists
  // esbuild. Same list `vendo init` writes (NEXT_SERVER_EXTERNALS).
  serverExternalPackages: ["esbuild", "@electric-sql/pglite"],
  // --- /vendo
};

export default nextConfig;
