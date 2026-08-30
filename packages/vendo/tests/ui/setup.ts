/**
 * Test-realm bridge: vitest's jsdom environment supplies jsdom's
 * `AbortController`, while `fetch` stays Node's undici — which rejects
 * foreign `AbortSignal` instances outright ("Expected signal to be an
 * instance of AbortSignal"). Re-wrap any provided signal into a native
 * one so cross-realm aborts keep working exactly like a browser.
 */
import { Blob as NativeBlob } from "node:buffer";
import { transferableAbortController } from "node:util";
import { cleanup, configure } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

/**
 * Raise Testing Library's default async-utility window from 1s to 10s for the
 * whole package. The chrome streaming tests await streamed UI with bare
 * `findBy*` / `waitFor` calls (the retry banner, "Turn complete", a minted
 * thread arriving in the sidebar); under the CI coverage (v8) instrumentation
 * job those settles intermittently exceed the 1s default, surfacing as flaky
 * "Unable to find role=button 'Retry' / 'Fixture thread'" failures on shared
 * runners. Widening the ceiling only adds headroom under load — a query still
 * resolves the moment its element appears, so fast local runs are unaffected.
 */
configure({ asyncUtilTimeout: 10000 });

/**
 * This package's vitest config does not enable `globals`, so
 * @testing-library/react's automatic per-test cleanup (which keys off a global
 * `afterEach`) never registers. Without it, every rendered component stays
 * mounted across the whole file — its effects, listeners, and animation frames
 * outlive the test. Register cleanup explicitly so each test unmounts before the
 * next, matching standard RTL semantics.
 */
afterEach(cleanup);

/**
 * jsdom shares one `window` (and therefore one localStorage origin) across
 * every test in a file. Chrome persists real state there — discoverability
 * fire-once flags, the overlay's remembered conversation (F10) — so a test's
 * writes would otherwise leak into its neighbors: a thread id remembered in
 * one test resurfaces as a resumed conversation in the next, which both
 * changes what mounts and races any immediate send against the stale-id
 * self-heal. Every test starts with clean origin storage; suites that seed
 * storage do so after this runs.
 */
beforeEach(() => {
  try {
    window.localStorage.clear();
  } catch {
    /* node-environment files have no window — nothing persisted anyway */
  }
});

/**
 * jsdom has no pseudo-element styles, and answers any
 * `getComputedStyle(el, "::before")` with a "Not implemented" jsdomError that
 * it routes to console.error. The screen capture (src/situation.ts) walks the
 * page through aria-snapshot, whose accessible-name computation reads
 * `::before`/`::after` content per the accname spec — legitimate in a real
 * browser, pure noise here, and loud enough to trip suites that assert
 * console.error is never called. Answer pseudo-element queries with the CSS
 * initial `content: none` (i.e. this pseudo generates no text), which is what
 * jsdom's styleless pseudo-elements actually mean; real element queries still
 * go to jsdom. No repo code passes a pseudo-element argument.
 */
const nativeGetComputedStyle = globalThis.getComputedStyle;

globalThis.getComputedStyle = ((element: Element, pseudoElement?: string | null) =>
  pseudoElement === undefined || pseudoElement === null
    ? nativeGetComputedStyle(element)
    : ({ content: "none", display: "inline", visibility: "visible" } as unknown as CSSStyleDeclaration)
) as typeof globalThis.getComputedStyle;

const nativeFetch = globalThis.fetch;

/**
 * The same realm break, on the BODY. undici reads bytes out of its own `Blob`
 * only: it takes any object carrying `arrayBuffer()` for one, then asks it for
 * the `stream()` jsdom has never implemented — a hard throw on Node 22, while
 * Node 22/24 quietly stringify a jsdom Blob that lacks `arrayBuffer()` into the
 * body "[object File]". (jsdom 25's Blob had neither method, so an upload sent
 * that string and every assertion about it still passed.) Re-wrap a foreign
 * Blob into a native one, media type included, so an uploaded file crosses the
 * realm as its own bytes — exactly what a browser's fetch puts on the wire.
 */
async function nativeBody(body: BodyInit | null | undefined): Promise<BodyInit | null | undefined> {
  const blob = body as Blob | null | undefined;
  if (blob instanceof NativeBlob || typeof blob?.arrayBuffer !== "function") return body;
  return new NativeBlob([await blob.arrayBuffer()], { type: blob.type }) as Blob;
}

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const body = await nativeBody(init?.body);
  const signal = init?.signal;
  if (!signal) return nativeFetch(input, { ...init, body });
  const controller = transferableAbortController();
  if (signal.aborted) {
    controller.abort(signal.reason);
  } else {
    signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }
  return nativeFetch(input, { ...init, body, signal: controller.signal });
}) as typeof fetch;
