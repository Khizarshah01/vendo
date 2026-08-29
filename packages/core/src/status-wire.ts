/**
 * What `GET /status` answers — `@vendoai/vendo`'s door builds it and
 * `@vendoai/ui`'s chrome reads it, so the shape lives here where both can name
 * it. The route satisfies this type, which is what keeps the two in step.
 */
import type { GuardPosture } from "./guard.js";
import type { Membership } from "./run-context.js";

/** 05-guard §1 `status()` / 09-vendo §3 */
export interface VendoStatus {
  posture: GuardPosture;
  version: string;
  blocks: Record<string, unknown>;
  /** Build contract §9.1 — the orgs the host asserted for this caller this
      request. Absent on a single-player deployment; never stored anywhere. */
  memberships?: Membership[];
}
