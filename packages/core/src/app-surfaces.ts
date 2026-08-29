/**
 * The apps runtime's ANSWER shapes that the client must speak too.
 *
 * Membership rule, and the only one: a shape belongs here when `@vendoai/apps`
 * produces it and `@vendoai/ui` consumes it off the wire. `ui → apps` is not an
 * edge the dependency guard allows, so before this the client hand-declared its
 * own copy "verbatim from the frozen contract text" — which is a promise, not a
 * mechanism, and the copies drifted. Same split, same reason, as
 * {@link ./app-access.js}: the shape lives in core, the implementation stays in
 * the block that owns the behavior.
 *
 * Only the shapes BOTH sides speak move here. An apps-internal shape (the
 * placement STORAGE row, say) stays in apps.
 */
import type { AppId } from "./ids.js";

/** One row of `GET /slots` — a destination a mounted `VendoSlot` reported on
 *  this deployment. A slot id is the HOST's markup, not a Vendo document, so
 *  nothing knows a slot exists until a slot says so; the registry is what
 *  carries that to a surface (the "Add to…" picker) on another page. Newest
 *  first, and already filtered to what the caller may place into. */
export interface SlotEntry {
  /** The slot's `id` — the value that goes over the wire as a placement. */
  id: string;
  /** What a person choosing a destination reads. */
  label: string;
  /** What the spot is FOR, in the host developer's own words — the sentence an
   *  agent reads to pick between two slots a label alone cannot separate. */
  description?: string;
  /** When a mounted slot last reported itself. */
  lastSeen: string;
}

/**
 * One slot's answer — what is in it, and where that app's build stands. `status`
 * is derived from the app record on every read, never stored, so a build that
 * lands (or fails) needs no second write to correct the slot.
 */
export interface PlacementEntry {
  slot: string;
  app: AppId;
  /** The app's name, or "" while the build has not landed (there is no
   *  document yet to take a title from). */
  title: string;
  status: "ready" | "building" | "failed";
}
