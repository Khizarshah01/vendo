/**
 * The THREAD, as both halves of `GET /threads/:id` and `GET /threads` speak it.
 *
 * Here rather than in `@vendoai/vendo` (which owns the lifecycle — ids,
 * ownership, the guarded write) because `ui → vendo` is not an edge the
 * dependency guard allows, and the hand copy `@vendoai/vendo/ui` kept instead had
 * quietly lost `title` and `revision`: a surface reading a thread through it
 * could see neither the listing title the store already computed nor the
 * concurrency token it was handed. Same split, same reason, as
 * {@link ./app-surfaces.js}.
 */
import type { IsoDateTime, ThreadId } from "./ids.js";
import type { UIMessage } from "ai";

/** 03-agent §5 */
export interface Thread {
  id: ThreadId;
  subject: string;
  messages: UIMessage[];
  /** Precomputed listing title. Persisted beside the thread so `list` need not load the
   *  full messages array to derive it; absent on legacy rows (derived from messages then). */
  title?: string;
  /** The store's concurrency token for this row, as READ. Carried so the turn
   *  that resolved the thread can compare-and-swap on it directly instead of
   *  re-reading the whole row (and its transcript) for a token it already had.
   *  Absent on a thread that has never been written. */
  revision?: string;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/** 03-agent §5 */
export interface ThreadSummary {
  id: ThreadId;
  title: string;
  updatedAt: IsoDateTime;
}
