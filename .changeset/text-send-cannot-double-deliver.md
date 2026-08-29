---
"@vendoai/vendo": patch
---

**A retried text send can no longer put the same message on somebody's phone twice.**

`cloudTextChannel.send` rides out a console blip with three retries, and the
comment above them claimed a non-2xx answer proved nothing had been delivered.
It does not: Vendo Cloud hands the message to the messaging vendor and can then
fail — on the vendor's own error, on a throw after the hand-off, on this side's
30s budget expiring against the console's — and the bare `catch` re-posted an
identical body with no id on it. Four attempts, four visible bubbles.

Every send now mints one `Idempotency-Key` and carries the same one through its
own retries, which Vendo Cloud claims before it calls the vendor; a second
arrival is a no-op that answers success. Same posture `hostedStore` already uses
for a mutation that may or may not have landed. Additive and header-only — the
send body does not move, `ChannelsService` is unchanged, and a deployment older
than this keeps exactly the behaviour it shipped with. Retries also stop chasing
refusals Vendo Cloud meant (a bad body, a conversation that is not yours, a
stopped key), which only made a person wait a second longer for the same
failure.
