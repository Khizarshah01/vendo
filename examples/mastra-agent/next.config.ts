import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native/wasm server deps stay out of the bundle: Mastra's storage drivers
  // (libsql, duckdb) and the app-generation defaults (esbuild syntax-checks
  // generated islands; PGlite's Emscripten module breaks under production
  // chunking).
  serverExternalPackages: [
    // Not a dependency of this example: @mastra/core reaches @ast-grep/napi
    // through a dynamic import it already degrades without, and declares the
    // addon only as a devDependency. So this entry is inert wherever the addon
    // is absent, and the only thing that keeps the build alive wherever some
    // other package in the install brought it in — Turbopack cannot place a
    // .node binary in an ESM chunk.
    "@ast-grep/napi",
    "@duckdb/node-api",
    "@electric-sql/pglite",
    "@libsql/client",
    // --- vendo: PGlite (above) breaks under production chunking, and the
    // checker reaches esbuild through a VARIABLE specifier the bundler cannot
    // see. @vendoai/vendo itself is NOT listed: the list is package-granular and
    // the umbrella has a "use client" half, so externalizing it hands Next the
    // client doors through the server condition and prerender dies.
    // --- /vendo
    "esbuild",
  ],
};

export default nextConfig;
