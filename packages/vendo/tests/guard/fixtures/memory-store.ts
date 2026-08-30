import { memoryStoreAdapter } from "../../../src/core/conformance/index.js";

/** Canonical test-only StoreAdapter shared by block fixtures. */
export const createMemoryStore = memoryStoreAdapter;
export type MemoryStore = ReturnType<typeof memoryStoreAdapter>;
