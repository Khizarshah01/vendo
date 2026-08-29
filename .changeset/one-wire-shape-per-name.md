---
"@vendoai/core": minor
---

One definition per wire shape, and `@vendoai/ui` no longer keeps a copy of any
of them.

`@vendoai/ui` carried its own restatement of fifteen shapes the wire returns,
because it may depend on `@vendoai/core` and `@vendoai/apps` and nothing else,
so it could not name the packages that produce them. "Verbatim from the frozen
contract text" was a promise rather than a mechanism, and `Thread` had already
drifted: the copy was missing `title` (the listing title the store precomputes)
and `revision` (the concurrency token), so a surface reading a thread through
the client could see neither. The compile-time parity gate could not catch it —
both fields are optional, so each declaration stayed assignable to the other.

The shapes moved UP instead of being patched. `Thread`, `ThreadSummary`,
`ConnectionAccount`, `InitiatedConnection`, `ConnectableToolkit`, `RunRecord`,
`RunPlan`, `EnableResult`, `AutomationEntry`, `SlotEntry`, `UploadedFile`,
`GuardPosture`, `ApprovalResolution` and `VendoStatus` are now declared once in
`@vendoai/core`, and every producer imports the same declaration:
`@vendoai/vendo`'s thread repository and connection adapters, `@vendoai/actions`
(`ConnectorAccount` is core's `ConnectionAccount` now), `@vendoai/automations`,
`@vendoai/guard` and `@vendoai/apps`. The restatement file is deleted. Nothing
in ui's public surface changed — the same names are exported, from their owners.

One rename in `@vendoai/apps`: the slot registry answers `SlotEntry`, the name
the wire and the client already used, in place of `SlotRecord`.

`GET /status` now satisfies core's `VendoStatus` rather than building an
unnamed object literal, so the door and the client are held to one shape.
