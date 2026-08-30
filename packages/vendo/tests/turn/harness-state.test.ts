/**
 * §1.3's harness-state door, through BOTH of this package's drivers.
 *
 * Real embedded store, real `harnessStateStore`, real `createHarnessRuntime`;
 * only the thinker is scripted (CLAUDE.md: test the SEAM). Both drivers wire the
 * door — `turn.ts` for `chat()`/`run()`, `session.ts` for `session()` — and
 * nothing in this package touched `turn.state` before, so a driver that dropped
 * the slot would have shipped green: a harness that owns a session would silently
 * start from scratch every turn.
 */
import { defineHarness } from "../../src/harnesses/index.js";
import { createStore, type VendoStore } from "../../src/store/index.js";
import { describe, expect, it } from "vitest";
import { agent } from "../../src/turn/agent.js";

let stores = 0;
const memoryStore = (): VendoStore => createStore({ dataDir: `memory://agents-harness-state-${stores++}` });

/** A harness that OWNS a session: it resumes what the last turn stored and
 *  stores this turn's. */
const remembering = (resumed: Array<string | undefined>) => defineHarness({
  name: "remembering",
  async *run(turn) {
    resumed.push(turn.state.get());
    turn.state.set(`turn_${resumed.length}`);
    yield { type: "text" as const, delta: "ok" };
  },
});

describe("harness state written in one turn is read back in the next", () => {
  it("through the chat driver", async () => {
    const resumed: Array<string | undefined> = [];
    const support = agent({ name: "support", harness: remembering(resumed), store: memoryStore() });

    const first = support.chat("first", { as: "u_42" });
    await first;
    await support.chat("second", { as: "u_42", threadId: first.threadId });

    expect(resumed).toEqual([undefined, "turn_1"]);
  });

  it("through the session driver", async () => {
    const resumed: Array<string | undefined> = [];
    const support = agent({ name: "support", harness: remembering(resumed), store: memoryStore() });

    const session = await support.session("u_42");
    await (await session.stream("first")).text();
    await (await session.stream("second")).text();

    expect(resumed).toEqual([undefined, "turn_1"]);
  });
});
