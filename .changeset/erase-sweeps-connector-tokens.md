---
"@vendoai/core": patch
---

**The StoreOps erase case now proves a tenant connector's token leaves the vault.**

A tenant connector's vault name carries the org that owns it, so the subject axis
reaches the live credential and not only the registration rows that point at it.
The kit's subject-erase case seeds one, asserts it reads back `null`, and pairs
that with a host-config secret that must survive — a blanket `DELETE` over the
vault passes the first assertion and fails the second.

Caught a real gap in a hand-copied cascade whose report already listed
`vendo_secrets` and always answered `0`: the rows pointing at the credentials
were deleted, the decryptable credentials were not, and the caller was told the
erasure succeeded. The kit's memory reference gained the same prefix sweep.
