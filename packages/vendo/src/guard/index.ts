/** The guard — policy, approvals, audit, safety. Published as
    `@vendoai/vendo/guard`. */
export { createGuard } from "./guard.js";
// The drawers this block writes, and the parked-call clock. They are declared
// in @vendoai/vendo/core, not here, because their readers live outside the guard's
// own process — Vendo Cloud's console reads the audit trail and the parked
// approvals, and flips the freeze row a guard elsewhere obeys on its next
// check. Re-exported so a host wiring a guard still imports one package.
export {
  APPROVALS_COLLECTION,
  AUDIT_COLLECTION,
  CONTROLS_COLLECTION,
  DEFAULT_PARKED_CALL_TTL_MS,
  FREEZE_ROW,
} from "../core/index.js";
// The late-bound rules value (`guard({ policy, judge, approvals })`) and the
// discriminator every consumer of a `VendoGuard | GuardRules` slot needs.
// `createGuard` stays the one constructor both arms end at.
export { guard, isGuardInstance } from "./spec.js";
export { vendoAutoJudge } from "./judge.js";
// Preset expansion (00-overview decision 8): exported so a caller that needs
// a preset's ACTUAL rules outside a live guard instance (the try venue's
// demo policy.json, which ties itself to "autopilot" rather than hand-typing
// a duplicate rule) can derive them from the one place presets are defined,
// instead of drifting out of sync with a copy.
export { resolvePolicyConfig } from "./policy.js";
// Zod schemas for a .vendo/policy.json file and its rules. Public since 0.3.0
// (hosts validating a policy file before handing it to the guard); 0.4.x
// dropped them from the barrel by accident, so restore them here. Defined in
// @vendoai/vendo/core — a second repo validates policy files against them.
export { policyFileSchema, policyRuleSchema } from "../core/index.js";
// The ONE permission wire: the five approval/grant routes every mount serves,
// as a request→body function (the umbrella's routes delegate to it) and as a
// ready fetch handler (what @vendoai/vendo's `agentHandler` mounts).
export {
  handlePermissionRequest,
  permissionsHandler,
  type PermissionRequest,
  type PermissionsHandlerDeps,
} from "./permission-wire.js";
// Build contract §9.10 — the org-admin policy document's parser, exported for
// the composition seam that reads `/orgs/<orgId>/policy.json` out of the
// workspace and unions the rules into the guard's `orgPolicy` resolver.
export { parseOrgPolicyFile } from "./org-policy.js";
// Agents spec — the minimal runtime↔guard seam (defined in core beside the
// full Guard), re-exported here so a host wiring a custom guard imports one
// package.
export type { GuardLike } from "../core/index.js";
export type {
  ApprovalReading,
  GuardRules,
  Judge,
  PolicyConfig,
  PolicyConfigObject,
  PolicyFile,
  PolicyFn,
  PolicyPresetName,
  PolicyRule,
  RiskResolver,
  VendoGuard,
} from "./types.js";
