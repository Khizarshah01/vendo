---
"@vendoai/ui": patch
---

**Fixed a receipt that told the wrong lifecycle moment: `<VendoApproval>` said "Approved — ran" the instant the approval decision landed, before the call it authorizes had even run.**

The in-thread approval card and `<VendoApproval>` both settle the moment
`approvals.decide` resolves — the call itself may still be in flight — while
the BYO-agent embed settles only once the wire reports that call's own
outcome. All three used to hardcode their own copy of the approve line, and
`<VendoApproval>` used the embed's post-result wording ("ran") for its own
earlier, post-decide moment. A shared `APPROVAL_LINES` constant now backs all
three call sites, so the two lifecycle moments can no longer drift apart
silently: `<VendoApproval>` and the in-thread card now correctly read
"Approved — under way".
