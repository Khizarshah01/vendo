import { memoryStoreAdapter } from "../../core/conformance/index.js";

/** Canonical test-only StoreAdapter shared by block fixtures. */
export const memoryStore = memoryStoreAdapter;
export type MemoryStoreAdapter = ReturnType<typeof memoryStoreAdapter>;
