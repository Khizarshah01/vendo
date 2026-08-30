/**
 * The engine's ROUTED collection names, declared here because their readers
 * live outside the store's own process — Vendo Cloud's console builds a
 * footprint and a retention sweep off them (cloud/console/lib/api/store-doors.ts,
 * lib/data-plane/native-store/), and a reader's copy of a writer's collection
 * name drifts silently the moment the writer renames one. Core already spells
 * every one of them as a literal in ENGINE_COLLECTION_REGISTRY
 * (engine-collections.ts), so this is where the one spelling belongs.
 *
 * The engine's PRIVATE routing facts stay beside the engine that owns them:
 * ATOMIC_RESERVED_COLLECTIONS is never exported at all, and
 * RESERVED_CURSOR_COLUMNS names PHYSICAL COLUMNS, which only the layer allowed
 * to know the schema may read (the console's own data-plane fence draws exactly
 * that line).
 */

/** Collections routed to their own typed door and their own table (02-store §2). */
export const RESERVED_COLLECTIONS = [
  "vendo_grants",
  "vendo_approvals",
  "vendo_audit",
  "vendo_threads",
  "vendo_automations",
  "vendo_runs",
  "vendo_apps",
  "vendo_effects",
  "vendo_app_grants",
] as const;

/** Collections with a dedicated table but the generic record door over it. */
export const DEDICATED_RECORD_COLLECTIONS = [
  "vendo_mcp_clients",
  "vendo_mcp_grants",
  "vendo_knowledge_docs",
  "vendo_knowledge_chunks",
] as const;

export type ReservedCollection = typeof RESERVED_COLLECTIONS[number];
