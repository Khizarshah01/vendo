---
"@vendoai/core": patch
"@vendoai/ui": patch
"@vendoai/vendo": patch
---

Comments and READMEs stop citing the nine package names the fold retired

Every sentence that said a deleted package exports, depends on, or owns
something now names what actually holds it — a feature directory, a subpath of
the umbrella, or `@vendoai/core`. Sentences that narrate a retirement in the
past tense are unchanged, because they were already true.

`scripts/citation-guard.mjs` gains a second leg so this cannot silently return:
it derives the live package names from every tracked `package.json` and fails
on any `@vendoai/*` name in a doc or comment that is not one of them.
