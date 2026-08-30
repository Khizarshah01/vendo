import { execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const tsc = require.resolve("typescript/bin/tsc");
const packageDir = fileURLToPath(new URL("..", import.meta.url));
const fixtures: string[] = [];

afterEach(() => {
  for (const file of fixtures.splice(0)) rmSync(file, { force: true });
});

function typecheckFixture(source: string): string | null {
  const fixture = join(packageDir, `.wire-parity.${process.pid}.${Math.random().toString(36).slice(2)}.ts`);
  const config = fixture.replace(/\.ts$/, ".json");
  fixtures.push(fixture, config);
  writeFileSync(fixture, source);
  writeFileSync(config, JSON.stringify({
    compilerOptions: {
      strict: true,
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "Bundler",
      skipLibCheck: true,
      esModuleInterop: true,
      baseUrl: ".",
      // ui and agent intentionally expose `ai` as a peer. Force the same host
      // copy for both declarations, matching consumer resolution rather than
      // comparing their independently installed development copies.
      paths: { ai: ["./node_modules/ai"] },
    },
    files: [basename(fixture)],
  }));
  try {
    execFileSync(
      process.execPath,
      [tsc, "--project", config, "--noEmit"],
      { cwd: packageDir, stdio: "pipe" },
    );
    return null;
  } catch (error) {
    const result = error as { stdout?: Buffer; stderr?: Buffer };
    return `${result.stdout?.toString() ?? ""}${result.stderr?.toString() ?? ""}`;
  }
}

// WHAT IS LEFT TO CHECK, and why the list shrank.
//
// This file compared ui's hand copies against the blocks that produce them.
// Those copies are gone: the chat, connections, automations and status shapes
// have ONE definition each, in `@vendoai/core`, and both halves import it — so
// the rows for them became `Assignable<X, X>`, a green check that cannot fail,
// which is the exact thing this file exists to prevent. They are proven now by
// tests/core-wire-shapes.seam.test.ts, which reads the real door's answers back
// through the real client.
//
// The apps rows STAY, because `@vendoai/vendo/apps` genuinely ships two declarations
// of these names — the browser-safe contract door and the richer server one
// (see the header of packages/core/src/apps/wire-types.ts, which leaves unifying
// them to the slice that owns that behavior question). Two declarations is
// exactly what this gate is for.
//
// The repository gate runs `pnpm build` before `pnpm test`, so these package
// imports resolve freshly emitted declarations from both owning packages.
// That keeps the fixture type-only: importing their source roots would make an
// ad-hoc tsc invocation re-check unrelated runtime implementations as well.
const imports = `
import type {
  OpenSurface as UiOpenSurface,
  EditResult as UiEditResult,
  VersionEntry as UiVersionEntry,
  SeedDrift as UiSeedDrift,
} from "@vendoai/ui";
import type {
  OpenSurface as AppsOpenSurface,
  EditResult as AppsEditResult,
  VersionEntry as AppsVersionEntry,
  SeedDrift as AppsSeedDrift,
} from "../src/apps/index.js";

type Assignable<Source, Target> = [Source] extends [Target] ? true : false;
type Assert<T extends true> = T;
`;

describe("UI wire types stay structurally aligned with their owning blocks", () => {
  it("is assignable both ways for the two doors @vendoai/vendo/apps still ships", () => {
    const failure = typecheckFixture(`${imports}
type Checks = [
  Assert<Assignable<UiOpenSurface, AppsOpenSurface>>,
  Assert<Assignable<AppsOpenSurface, UiOpenSurface>>,
  Assert<Assignable<UiEditResult, AppsEditResult>>,
  Assert<Assignable<AppsEditResult, UiEditResult>>,
  Assert<Assignable<UiVersionEntry, AppsVersionEntry>>,
  Assert<Assignable<AppsVersionEntry, UiVersionEntry>>,
  Assert<Assignable<UiSeedDrift, AppsSeedDrift>>,
  Assert<Assignable<AppsSeedDrift, UiSeedDrift>>,
];
declare const checks: Checks;
void checks;
`);
    expect(failure, failure ?? "").toBeNull();
  });

  it("has teeth: a one-way incompatible wire shape fails the tsc gate", () => {
    const failure = typecheckFixture(`${imports}
type Broken = Assert<Assignable<UiEditResult, { definitelyNotOnTheWire: string }>>;
declare const broken: Broken;
void broken;
`);
    expect(failure).not.toBeNull();
    expect(failure).toContain("TS2344");
  });
});
