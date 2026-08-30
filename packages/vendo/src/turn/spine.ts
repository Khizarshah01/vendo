/**
 * The one body both code-facing turn drivers run.
 *
 * `turn.ts` (automations, `vendo_delegate`, `agent.chat()`, `agent.run()`,
 * `turns.resume()`) and `session.ts` (`agent().session()`, `agent().respond()`)
 * built the same runtime out of the same store doors, line for line — down to a
 * byte-identical comment on the render seam. This is that body, once.
 *
 * Two things it deliberately does NOT own:
 *
 * - The thread's LIFECYCLE (`ensureSchema`, `openThread`). A session opens its
 *   thread once and streams many turns over it; `turn.ts` opens one per turn.
 *   Owning `openThread` here would `put({ messages: [] })` on a session's second
 *   turn and delete the conversation the caller came back to read.
 * - The turn's ANSWER. The wire face wants the `Response` (and stamps
 *   `THREAD_ID_HEADER` on it); the code face drains it and reads a record back.
 *   Both are the caller's, so this hands back the `Response` and neither pays
 *   for the other's shape.
 */
import {
  createTurnSkills,
  hostSkillFiles,
  type FilesAdapter,
  type Guard,
  type Harness,
  type HarnessEvent,
  type RunContext,
  type SeatModels,
  type Skill,
  type ThreadId,
  type ToolRegistry,
} from "@vendoai/core";
import { wrapWorkspaceForRender } from "../apps/index.js";
import { createHarnessRuntime, type HarnessRuntimeDeps } from "../harnesses/index.js";
import {
  harnessStateStore,
  threadMessageStore,
  workspaceStore,
  type VendoStore,
} from "../store/index.js";
import type { LanguageModel, UIMessage } from "ai";
import type { MemoryAdapter } from "./memory.js";
import { resolveSystem, type SystemPromptHook } from "./prompt.js";

/** The composed world a turn runs in. Both drivers' own deps satisfy this
 *  structurally; each resolves the two that genuinely differ (`files`, and a
 *  `tools`/`harness` it may have wrapped) before handing it over. */
export interface SpineDeps {
  harness: Harness<unknown>;
  store: VendoStore;
  guard: Guard;
  /** Where workspace blobs land. `turn.ts` falls back to the store's own rows;
   *  a session is always composed with one. */
  files: FilesAdapter;
  /** Projected into the read-only `/host/skills` mount. */
  skills: readonly Skill[];
  /** The whole tool surface for this turn — GUARD-BOUND already, by the caller.
   *  The one choke point, so the spine never binds and never unwraps. */
  tools: ToolRegistry;
  instructions?: string;
  system?: SystemPromptHook;
  memory?: MemoryAdapter;
  models?: SeatModels<LanguageModel>;
  liveTurn?: HarnessRuntimeDeps["liveTurn"];
  /** The unattended lane's tool-call budget rides here. A session composes
   *  none, and gaining one would cap a person's chat turn. */
  bridge?: HarnessRuntimeDeps["bridge"];
}

export interface SpineInput {
  ctx: RunContext;
  threadId: ThreadId;
  /** The one message this caller contributes. */
  message: UIMessage;
  /**
   * Read the thread's prior turns back and put them before `message`.
   *
   * NOT the same question as "reopen an existing thread": a session mints its
   * thread once and then streams turn after turn over it, so from its SECOND
   * turn on there is history to read on a thread it did not reopen. Wire this
   * to a driver's reopen flag and a session's second turn hands the harness an
   * empty conversation.
   */
  readHistory: boolean;
  /**
   * THE POSTURE. Required, never derived, never defaulted.
   *
   * `true` — a turn that asks for permission BLOCKS on the tap, and an
   * unanswered card dies with the turn. `false` — it returns a refusal at once
   * and the card STANDS, so `turns.resume()` can answer it days later. A
   * default here is a silent consent change.
   */
  interactive: boolean;
  /** §9.7 — the org mounts the caller asserted for this turn. A session asserts
   *  none. */
  memberships?: RunContext["memberships"];
  observe?: (event: HarnessEvent) => void;
  signal?: AbortSignal;
}

export async function runHarnessTurn(deps: SpineDeps, input: SpineInput): Promise<Response> {
  const { principal } = input.ctx;
  const transcript = threadMessageStore<UIMessage>(deps.store);
  // The SPONSOR's durable workspace, with the `/host/skills` projection and the
  // org mounts (§9.7) the ctx asserted.
  const workspace = await workspaceStore(deps.store, { files: deps.files })
    .open(principal, {
      host: hostSkillFiles(deps.skills),
      ...(input.memberships === undefined ? {} : { memberships: input.memberships }),
    });

  const runtime = createHarnessRuntime({
    // THE CALLER's registry, never one of this turn's own choosing.
    tools: deps.tools,
    guard: deps.guard,
    // Read off THIS turn's mount, so a skill the host stopped shipping is gone
    // the moment they deploy.
    skills: createTurnSkills(workspace),
    transcript,
    // A turn that CONTINUES a thread has to carry what the harness remembered
    // on it; a fresh thread has nothing stored, so wiring it costs nothing.
    harnessState: harnessStateStore(deps.store),
    // §1.6 — the render seam, on the runtime's generic `wrapWorkspace` slot: a
    // commit that lands `app.tsx` paints (the part persists, so the thread shows
    // the screen the turn built). BARE — no floor, no app half — because this
    // runtime composes no apps runtime to fill them; the umbrella's composition
    // does (`packages/vendo/src/harness-turn.ts`).
    wrapWorkspace: (turnWorkspace, opts) => wrapWorkspaceForRender(turnWorkspace, {
      turnId: opts.turnId,
      emit: opts.emit,
    }),
    ...(deps.bridge === undefined ? {} : { bridge: deps.bridge }),
    ...(deps.liveTurn === undefined ? {} : { liveTurn: deps.liveTurn }),
  });

  const system = await resolveSystem(deps, input.ctx);
  const persisted = input.readHistory ? await transcript.list(principal, input.threadId) : [];

  return runtime.run({
    harness: deps.harness,
    threadId: input.threadId,
    messages: [...persisted, input.message],
    ctx: input.ctx,
    workspace,
    interactive: input.interactive,
    system,
    ...(deps.models === undefined ? {} : { models: deps.models }),
    ...(input.observe === undefined ? {} : { observe: input.observe }),
    ...(input.signal === undefined ? {} : { signal: input.signal }),
  });
}
