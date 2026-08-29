---
---

S9's turn-driver merge: `packages/vendo/src/turn/turn.ts` and
`packages/vendo/src/turn/session.ts` shared a turn body line for line, and now
run one `runHarnessTurn` (`src/turn/spine.ts`). `interactive` is an explicit,
required argument on it — never derived, never defaulted — so both postures
survive unchanged: the code-facing lane keeps `false` (a parked approval card
stands, and `turns.resume()` can answer it days later) and the HTTP-facing lane
keeps `true` (the turn waits for the tap).

Internal only. `spine.ts` is exported from no barrel, both drivers keep their
exact signatures, and a differential harness
(`tests/turn/spine-differential.test.ts`) proves the merged drivers are
observationally identical to byte-frozen copies of the originals — same
transcript rows, same guard pending feed, same audit rows, same wire bytes —
across presence x park x budget x resume, with an EMPTY allow-list. No shipped
behaviour changes, so no package needs a release.
