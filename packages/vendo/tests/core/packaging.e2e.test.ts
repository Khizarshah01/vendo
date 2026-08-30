/**
 * Packaging e2e — consumes the contract half exactly the way a host will:
 * `pnpm pack` the real artifact, extract it, resolve the exports map, and
 * import the PACKED dist (not src). Since the fold that means packing the
 * umbrella and reading the seven doors the fold added, which are the surface it
 * replaced the two retired packages with. The Bun leg runs when a bun binary is
 * present (local dev) and is skipped cleanly otherwise.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterAll, describe, expect, it } from "vitest";

const PACKAGE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const WORK_DIR = join(PACKAGE_DIR, ".e2e-pack");

const RUNTIME_EXPORTS = [
  "VENDO_APP_FORMAT",
  "VENDO_POLICY_FORMAT", "VENDO_CAPABILITY_MISS_FORMAT", "descriptorHash", "VendoError",
  "safeErrorMessage", "canonicalJson", "sha256Hex", "TOOL_NAME_PATTERN",
  "TREE_MAX_NODES", "TREE_MAX_QUERIES", "TREE_MAX_GENERATED_COMPONENTS",
  "TREE_MAX_COMPONENT_SOURCE_CHARS", "TREE_MAX_TOTAL_COMPONENT_CHARS", "isPathBinding", "isStateBinding",
  "principalSchema", "runContextSchema", "triggerRefSchema", "riskLabelSchema",
  "toolDescriptorSchema", "toolCallSchema", "toolOutcomeSchema",
  "grantScopeSchema", "grantDurationSchema", "permissionGrantSchema", "approvalRequestSchema",
  "approvalDecisionSchema", "guardDecisionSchema", "auditEventSchema", "uiPayloadSchema",
  "treeNodeSchema", "appDocumentSchema",
  "appSeedSchema", "triggerSourceSchema", "stepSchema",
  "budgetSchema", "automationTaskSchema", "automationRecordSchema",
  "vendoRecordSchema", "recordQuerySchema", "authMaterialSchema", "agentRunReportSchema",
  "vendoViewPartSchema", "vendoApprovalPartSchema", "vendoErrorCodeSchema",
  "capabilityMissToolFailureSchema", "capabilityMissTriggerSchema", "capabilityMissEventSchema",
  "appIdSchema", "grantIdSchema", "approvalIdSchema", "runIdSchema", "threadIdSchema",
  "isoDateTimeSchema", "jsonSchemaSchema",
  "VENDO_TREE_FORMAT", ];

/** Every door the core+ui fold added. The two with a `require` leg are the
 *  contract half; the rest are the ui half, which is client React and cannot be
 *  imported in a Node test — so they are proven to SHIP, which is the failure
 *  mode a declared-but-unbuilt entry actually has. */
const FOLDED_DOORS = [
  "./core", "./core/apps", "./core/conformance",
  "./ui", "./ui/chrome", "./ui/tree", "./ui/kit",
] as const;
type FoldedDoor = (typeof FOLDED_DOORS)[number];

interface PackedPackage {
  dir: string;
  manifest: Record<string, unknown>;
  resolve(subpath: FoldedDoor): string;
}

let packedCache: PackedPackage | undefined;

const packOnce = (): PackedPackage => {
  if (packedCache !== undefined) return packedCache;
  rmSync(WORK_DIR, { recursive: true, force: true });
  mkdirSync(WORK_DIR, { recursive: true });
  execFileSync("pnpm", ["pack", "--pack-destination", WORK_DIR], { cwd: PACKAGE_DIR, stdio: "pipe" });
  const tarball = readdirSync(WORK_DIR).find((name) => name.endsWith(".tgz"));
  if (tarball === undefined) throw new Error("pnpm pack produced no tarball");
  execFileSync("tar", ["-xzf", join(WORK_DIR, tarball), "-C", WORK_DIR], { stdio: "pipe" });
  const dir = join(WORK_DIR, "package");
  const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as Record<string, unknown>;
  const exportsMap = manifest.exports as Record<string, { types: string; default: string }>;
  packedCache = {
    dir,
    manifest,
    resolve: (subpath) => join(dir, exportsMap[subpath]!.default),
  };
  return packedCache;
};

afterAll(() => {
  rmSync(WORK_DIR, { recursive: true, force: true });
});

describe("packaging e2e — the artifact blocks will install", () => {
  it("packs with a well-formed manifest: dist only, every folded door, types beside code", () => {
    const packed = packOnce();
    const exportsMap = packed.manifest.exports as Record<string, { types: string; default: string }>;
    for (const subpath of FOLDED_DOORS) {
      expect(exportsMap[subpath]).toBeDefined();
      expect(existsSync(packed.resolve(subpath))).toBe(true);
      expect(existsSync(join(packed.dir, exportsMap[subpath]!.types))).toBe(true);
    }
    // The `require` legs are the CJS surface, and only ./core and
    // ./core/conformance have one — asserted by name so adding or dropping one
    // is a deliberate edit here rather than a silent change in the manifest.
    const withRequire = FOLDED_DOORS.filter((subpath) =>
      "require" in (exportsMap[subpath] as Record<string, unknown>));
    expect(withRequire).toEqual(["./core", "./core/conformance"]);
    for (const subpath of withRequire) {
      const cjs = (exportsMap[subpath] as unknown as { require: string }).require;
      expect(existsSync(join(packed.dir, cjs)), `${subpath} require leg`).toBe(true);
    }
    // The engine's wasm ships beside dist or the screen VM has no bytes.
    expect(existsSync(join(packed.dir, "quickjs.wasm"))).toBe(true);
    // dist-only artifact: no sources, no tests, no vectors in the tarball
    expect(existsSync(join(packed.dir, "src"))).toBe(false);
    expect(existsSync(join(packed.dir, "vectors"))).toBe(false);
  }, 30_000);

  it("root import exposes the full contract surface and behaves", async () => {
    const packed = packOnce();
    const core = await import(pathToFileURL(packed.resolve("./core")).href);
    const missing = RUNTIME_EXPORTS.filter((name) => !(name in core));
    expect(missing).toEqual([]);

    // behavior spot-checks through the packed artifact. The tree validator moved
    // to `@vendoai/vendo/core/apps` with the rest of the app format, so the schema
    // core still owns stands in for it — the subject is the packed artifact, not
    // which validator it carries.
    const parsed = core.appDocumentSchema.safeParse({
      format: "vendo/app@1", id: "app_a", name: "A", ui: "tree",
    });
    expect(parsed.success).toBe(true);
    const err = new core.VendoError("not-found", "missing");
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe("not-found");
  }, 30_000);

  it("reproduces the committed descriptor-hash vectors from the packed artifact", async () => {
    const packed = packOnce();
    const core = await import(pathToFileURL(packed.resolve("./core")).href);
    const vectors = JSON.parse(
      readFileSync(join(PACKAGE_DIR, "vectors", "descriptor-hash.json"), "utf8"),
    ) as { vectors: Array<{ name: string; descriptor: unknown; canonical: string; hash: string }> };
    expect(vectors.vectors.length).toBeGreaterThanOrEqual(5);
    for (const vector of vectors.vectors) {
      expect(core.canonicalJson({
        name: (vector.descriptor as { name: string }).name,
        description: (vector.descriptor as { description: string }).description,
        inputSchema: (vector.descriptor as { inputSchema: unknown }).inputSchema,
        risk: (vector.descriptor as { risk: string }).risk,
        ...((vector.descriptor as { confirmEach?: boolean }).confirmEach !== undefined
          ? { confirmEach: (vector.descriptor as { confirmEach?: boolean }).confirmEach }
          : {}),
      })).toBe(vector.canonical);
      expect(core.descriptorHash(vector.descriptor)).toBe(vector.hash);
    }
  });

  it("conformance subpath is consumable: memory double passes its own suite", async () => {
    const packed = packOnce();
    const conformance = await import(pathToFileURL(packed.resolve("./core/conformance")).href);
    const report = await conformance.runConformance(conformance.storeAdapterConformance({
      async makeAdapter() {
        return { adapter: conformance.memoryStoreAdapter() };
      },
    }));
    expect(report.failures).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it("ships a platform-clean dist (no node:/platform imports — edge/Bun-portable)", () => {
    const packed = packOnce();
    const distDir = join(packed.dir, "dist");
    const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
    );
    // CORE-10: dist/cjs is the CommonJS condition — require() IS its module
    // system. The platform-clean (edge/Bun) guarantee applies to the ESM dist,
    // the `default` condition every non-CJS runtime resolves.
    //
    // SCOPED TO dist/core, which is exactly the tree that used to be the whole
    // of the retired contract package's dist — same file set, one dir deeper. The
    // umbrella's other halves (store, cli, sandbox, actions) are Node-side by
    // design and were never under this claim; asserting over all of dist/ would
    // not be a stronger gate, it would be a false one.
    //
    // dist/core/apps — the app-generation contract door — is the one exception
    // inside that scope, and it is FENCED rather than trusted. Its screen engine
    // reaches a `node:` arm through the `#engine/wasm` condition that no edge
    // runtime ever takes, and its browser leg is proven by Leg D of
    // scripts/portability-gate.mjs, which bundles that exact entry for a
    // browser target. The exception is only sound while nothing portable can
    // reach it, so that premise is ASSERTED below instead of assumed: the day
    // the contract root or its conformance kit re-exports the engine, this test
    // goes red on its own. Every other file keeps exactly the coverage it had.
    const coreDir = join(distDir, "core");
    const cjsDir = join(distDir, "cjs", "core");
    const appsDir = join(coreDir, "apps");
    const reachable = (entry: string): string[] => {
      const seen = new Set<string>();
      const visit = (file: string): void => {
        if (seen.has(file) || !existsSync(file)) return;
        seen.add(file);
        for (const [, spec] of readFileSync(file, "utf8").matchAll(/\bfrom\s*["'](\.[^"']*)["']/g)) {
          visit(join(dirname(file), spec!));
        }
      };
      visit(entry);
      return [...seen];
    };
    const portable = (["./core", "./core/conformance"] as const).flatMap((subpath) => reachable(packed.resolve(subpath)));
    expect(portable.length).toBeGreaterThan(50); // a graph that collapsed to its entries proves nothing
    expect(portable.filter((file) => file.startsWith(appsDir))).toEqual([]);

    for (const file of walk(coreDir).filter((name) =>
      name.endsWith(".js") && !name.startsWith(appsDir))) {
      const source = readFileSync(file, "utf8");
      expect(source, `${file} imports a platform module`).not.toMatch(/from\s+["']node:/);
      expect(source, `${file} uses require`).not.toMatch(/\brequire\s*\(/);
    }
    // The CJS leg still must not touch platform modules. It has no apps leg at
    // all — tsconfig.cjs.json excludes src/core/apps, because the door reads
    // `import.meta.url` and resolves `#engine/wasm`, and CommonJS can do neither.
    for (const file of walk(cjsDir).filter((name) => name.endsWith(".js"))) {
      const source = readFileSync(file, "utf8");
      expect(source, `${file} imports a platform module`).not.toMatch(/require\(["']node:/);
    }
  });

  it("imports and runs on Bun when a bun binary is available (skips cleanly otherwise)", () => {
    const packed = packOnce();
    let bunPath: string;
    try {
      bunPath = execFileSync("which", ["bun"], { encoding: "utf8" }).trim();
    } catch {
      console.log("bun not installed — Bun leg skipped (runs on machines with bun)");
      return;
    }
    const script = `
      const core = await import(${JSON.stringify(pathToFileURL(packed.resolve("./core")).href)});
      const conf = await import(${JSON.stringify(pathToFileURL(packed.resolve("./core/conformance")).href)});
      const parsed = core.appDocumentSchema.safeParse({ format: "vendo/app@1", id: "app_a", name: "A", ui: "tree" });
      const hash = core.descriptorHash({ name: "t", description: "", inputSchema: {}, risk: "read" });
      const report = await conf.runConformance(conf.storeAdapterConformance({ makeAdapter: async () => ({ adapter: conf.memoryStoreAdapter() }) }));
      if (!parsed.success || !hash.startsWith("sha256:") || !report.ok) throw new Error("bun leg failed");
      console.log("BUN_OK");
    `;
    const output = execFileSync(bunPath, ["-e", script], { encoding: "utf8" });
    expect(output).toContain("BUN_OK");
  });
});
