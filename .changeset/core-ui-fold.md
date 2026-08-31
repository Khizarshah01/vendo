---
"@vendoai/vendo": minor
---

**`@vendoai/core` and `@vendoai/ui` fold into `@vendoai/vendo`.** Both stay
published at 0.60.0, their last release — nothing you already installed stops
working, and there is no window where you cannot get both surfaces.

Every symbol keeps the exact surface it had. Each block's own barrel is
republished whole at a subpath of the umbrella, so a migration is a specifier
rewrite and nothing else:

| was | is |
| --- | --- |
| `@vendoai/core` | `@vendoai/vendo/core` |
| `@vendoai/core/apps` | `@vendoai/vendo/core/apps` |
| `@vendoai/core/conformance` | `@vendoai/vendo/core/conformance` |
| `@vendoai/ui` | `@vendoai/vendo/ui` |
| `@vendoai/ui/chrome` | `@vendoai/vendo/ui/chrome` |
| `@vendoai/ui/tree` | `@vendoai/vendo/ui/tree` |
| `@vendoai/ui/kit` | `@vendoai/vendo/ui/kit` |

Note the `/ui` level stays: it is `@vendoai/vendo/ui/chrome`, not
`@vendoai/vendo/chrome`. And the app half is `@vendoai/vendo/core/apps` —
`@vendoai/vendo/apps` was already taken by the server-side half.

`@vendoai/vendo/core` keeps the `require` condition the old root export carried,
so a CommonJS host on Node without `require(esm)` still loads the contracts.

Scaffolds from `vendo init` need no change — they import `/server` and `/react`,
which are untouched. If you import `@vendoai/ui` in a component provider or wrap
a component in `Remixable`, `vendo sync` goes on recognizing the old specifier
alongside the new one, so your catalog does not empty out mid-migration.
