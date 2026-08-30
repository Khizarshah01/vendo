/**
 * The drawers the guard writes, and the parked-call clock, declared here
 * because their READERS live outside the guard's own process — Vendo Cloud's
 * console reads the audit trail and the parked approvals, and flips the freeze
 * row a guard elsewhere obeys on its next check. They were spelled a second
 * time over there; a reader's copy of a writer's collection name drifts
 * silently the moment the writer renames one. Core already names three of them
 * as literals in ENGINE_COLLECTION_REGISTRY (engine-collections.ts), so this is
 * where the one spelling belongs.
 *
 * The guard's own private drawers — grants, approval claims — stay beside the
 * engine that owns them: nothing outside it reads those.
 */

/** A BYO loop has no turn-driven abandonment sweep, so an orphaned approval
 *  card in a foreign chat expires on time instead: generous enough to walk away
 *  and come back, bounded enough that stale writes can't be approved days
 *  later. */
export const DEFAULT_PARKED_CALL_TTL_MS = 60 * 60_000;

export const APPROVALS_COLLECTION = "vendo_approvals";
export const AUDIT_COLLECTION = "vendo_audit";

/** The emergency stop is a ROW (`freeze`, `{ frozen, by, at }`) and not a config
 *  field: the moment you need a kill switch is the moment you cannot redeploy to
 *  get one, so the console flips this row directly and a guard in another
 *  process obeys it on its next check. */
export const CONTROLS_COLLECTION = "guard:controls";
export const FREEZE_ROW = "freeze";
