#!/usr/bin/env node
/** Hand-copy guard — a member set the console re-declares is a member set that
 *  will drift.
 *
 *  A MIRRORED CONSTANT IS A SEAM (the phrase is
 *  cloud/console/tests/metering-registry-drift.test.ts's, and that test is this
 *  gate's ancestor: it compares the metering registry against the REAL .sql
 *  files rather than a copy of them). This generalises the idea to the seam that
 *  produced nine defects at once — `@vendoai/core` exports a vocabulary, the
 *  console spells the same words again by hand, one side gains a word, and
 *  nothing goes red. Every one of those nine sites carried a comment claiming
 *  parity. A comment asserting parity is not parity; this is.
 *
 *  THE RULE: a string-literal member set declared in cloud/console/** whose
 *  members EQUAL a set `@vendoai/core` exports is an error. Import core's.
 *
 *  Equality, not containment, is the whole design. The nine defects were all
 *  SUBSETS — copies that had already lost a member — but subset is unusable as
 *  a rule: core's own `GradedRiskLabel` is a deliberate subset of `RiskLabel`,
 *  and every two-word set is a subset of something. So this fires at the moment
 *  a copy is BORN, while it is still faithful, and the fix (import it) means
 *  there is no copy left to drift. Catching the birth beats detecting the death.
 *
 *  A set is: `z.enum([...])`, a `const` bound to an array of string literals
 *  (with or without `as const` — a `readonly Foo[]` annotation makes the same
 *  frozen vocabulary), or a string-literal union type. Core's side additionally
 *  must be EXPORTED: an internal set is not something the console could import.
 *
 *  There is no ignore list, and adding one is how this gate dies. A coincidental
 *  match — two unrelated sets that happen to agree — is a false positive to be
 *  fixed by sharpening the rule, never by exempting a file.
 *
 *  Known residual gaps (accepted): a set spelled as `new Set([...])` or a TS
 *  `enum` is not matched — the console has neither today, and widening on
 *  speculation costs more than it catches. An exhaustive `Record<Venue, …>` is
 *  deliberately NOT matched: its keys are checked by the compiler against
 *  core's type, which makes it the FIX, not the defect.
 *
 *  Run: node scripts/hand-copy-guard.mjs  (wired into `pnpm lint`).
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = dirname(dirname(fileURLToPath(import.meta.url)));

const gitFiles = (...patterns) =>
  execFileSync("git", ["ls-files", "-z", ...patterns], { cwd: root, maxBuffer: 1024 * 1024 * 32 })
    .toString("utf8")
    .split("\0")
    .filter(Boolean);

/** The array's elements as strings, or null if any element is not a string
 *  literal — a set built from identifiers or spreads is already derived. */
function stringMembers(node) {
  if (!ts.isArrayLiteralExpression(node)) return null;
  const members = [];
  for (const element of node.elements) {
    if (!ts.isStringLiteral(element)) return null;
    members.push(element.text);
  }
  return members.length > 0 ? members : null;
}

/** A union of string literals as strings, or null for any other type. */
function unionMembers(type) {
  if (!ts.isUnionTypeNode(type)) return null;
  const members = [];
  for (const member of type.types) {
    if (!ts.isLiteralTypeNode(member) || !ts.isStringLiteral(member.literal)) return null;
    members.push(member.literal.text);
  }
  return members.length > 0 ? members : null;
}

/** `x as const`, `x satisfies T` — the assertion is not the value. */
const unwrap = (expr) =>
  ts.isAsExpression(expr) || ts.isSatisfiesExpression(expr) ? unwrap(expr.expression) : expr;

const isExported = (node) =>
  node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) === true;

/** Every literal member set declared in one file. */
function memberSetsIn(file) {
  const source = ts.createSourceFile(
    file,
    readFileSync(join(root, file), "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const sets = [];
  const at = (node) => source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;

  const visit = (node) => {
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (!decl.initializer || !ts.isIdentifier(decl.name)) continue;
        const value = unwrap(decl.initializer);
        // `z.enum([...])`, however the module named its zod import.
        const members = ts.isCallExpression(value)
          ? value.expression.getText(source).endsWith("enum") && value.arguments[0]
            ? stringMembers(unwrap(value.arguments[0]))
            : null
          : stringMembers(value);
        if (members) sets.push({ name: decl.name.text, members, line: at(decl), exported: isExported(node) });
      }
    }
    if (ts.isTypeAliasDeclaration(node)) {
      const members = unionMembers(node.type);
      if (members) sets.push({ name: node.name.text, members, line: at(node), exported: isExported(node) });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return sets;
}

/** Order and repetition are not the vocabulary; the members are. */
const canon = (members) => [...new Set(members)].sort();
const key = (members) => JSON.stringify(canon(members));

const core = new Map();
for (const file of gitFiles("packages/core/src/*.ts")) {
  for (const set of memberSetsIn(file)) {
    if (!set.exported) continue;
    if (!core.has(key(set.members))) core.set(key(set.members), []);
    core.get(key(set.members)).push(`${set.name} (${file}:${set.line})`);
  }
}

const copies = [];
for (const file of gitFiles("cloud/console/*.ts", "cloud/console/*.tsx")) {
  for (const set of memberSetsIn(file)) {
    const exports = core.get(key(set.members));
    if (exports) copies.push({ file, ...set, exports });
  }
}

for (const copy of copies) {
  console.error(
    `hand-copy-guard: ${copy.file}:${copy.line} ${copy.name} re-declares a set @vendoai/core already exports\n` +
      `    members: ${canon(copy.members).join(", ")}\n` +
      `    import it from "@vendoai/core" instead: ${copy.exports.join(", ")}`,
  );
}

if (copies.length > 0) {
  console.error(`hand-copy-guard: ${copies.length} hand-copied member set(s)`);
  process.exit(1);
}
console.log(`hand-copy-guard: ${core.size} core member sets, none re-declared in cloud/console`);
