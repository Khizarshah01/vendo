import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// react.tsx is a "use client" boundary. Next's flight loader builds a
// client-reference manifest by statically enumerating a client module's named
// exports; it cannot do that through `export * from "../src/ui/index.js"` ("export *
// in a client boundary" build error). The fix is explicit named re-exports —
// this test both bans the `export *` regression and makes a future
// `@vendoai/vendo/ui` addition that react.tsx forgets to re-export fail loudly here
// instead of silently missing from the client surface.

const reactSourcePath = fileURLToPath(new URL("../src/react.tsx", import.meta.url));

describe("react.tsx client-boundary re-exports of @vendoai/vendo/ui", () => {
  it("does not use `export *` (Next's flight loader can't enumerate it across a use-client boundary)", () => {
    const source = readFileSync(reactSourcePath, "utf8");
    // Any `export *`, not one spelling of one specifier: the fold turned the ui
    // barrel from a package import into a relative one, and a ban that names the
    // old specifier is a ban that can no longer fire.
    expect(source).not.toMatch(/^\s*export\s+\*/m);
  });

  it("names every current @vendoai/vendo/ui runtime export explicitly", async () => {
    const ui = await import("../src/ui/index.js");
    const reactEntry = await import("../src/react.js");

    const uiKeys = Object.keys(ui).sort();
    expect(uiKeys.length).toBeGreaterThan(0);

    const missing = uiKeys.filter((key) => !(key in reactEntry));
    expect(missing, `react.tsx is missing named re-exports for: ${missing.join(", ")}`).toEqual([]);
  });
});
