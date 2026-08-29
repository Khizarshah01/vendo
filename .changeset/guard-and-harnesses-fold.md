---
"@vendoai/core": minor
"@vendoai/vendo": minor
---

**`@vendoai/guard` and `@vendoai/harnesses` fold into `@vendoai/vendo`; the
guard's policy contract moves to `@vendoai/core`.** Both retired packages stay
published at 0.56.0 — nothing you already installed stops working.

Every symbol keeps the exact surface it had. Each block's own barrel is
republished whole at a subpath of the umbrella, so a migration is a specifier
rewrite and nothing else:

| was | is |
| --- | --- |
| `@vendoai/guard` | `@vendoai/vendo/guard` |
| `@vendoai/harnesses` | `@vendoai/vendo/harnesses` |
| `@vendoai/harnesses/vendo` | `@vendoai/vendo/harnesses/vendo` |
| `@vendoai/harnesses/claude-code` | `@vendoai/vendo/harnesses/claude-code` |
| `@vendoai/harnesses/claude-code/box` | `@vendoai/vendo/harnesses/claude-code/box` |
| `@vendoai/harnesses/claude-turn` | `@vendoai/vendo/harnesses/claude-turn` |
| `@vendoai/harnesses/inference` | `@vendoai/vendo/harnesses/inference` |
| `@vendoai/harnesses/inference/credential` | `@vendoai/vendo/harnesses/inference/credential` |
| `@vendoai/harnesses/box-door` | `@vendoai/vendo/box-door` |

Most hosts need no rewrite at all: `vendo`, `createGuard`, `guard`,
`VendoGuard`, `GuardRules` and the policy types were already re-exported from
`@vendoai/vendo` and `@vendoai/vendo/server`, and still are.

**Eight names are now `@vendoai/core`'s**, because a contract that a second
process validates against must be declared once: the policy rule and file
types `PolicyRule`, `PolicyFn`, `PolicyPresetName`, `PolicyConfigObject`,
`PolicyConfig` and `PolicyFile`, and their zod schemas `policyRuleSchema` and
`policyFileSchema`. Core already owned `VENDO_POLICY_FORMAT`, the format
literal those schemas are keyed on, so the schema now sits beside the constant
it validates. The five guard collection names — `APPROVALS_COLLECTION`,
`AUDIT_COLLECTION`, `CONTROLS_COLLECTION`, `FREEZE_ROW` and
`DEFAULT_PARKED_CALL_TTL_MS` — move for the same reason, and because core's
`ENGINE_COLLECTION_REGISTRY` already spelled three of them as literals.

`@vendoai/vendo/guard` re-exports all thirteen, so an import through the guard
barrel is unchanged. The guard ENGINE — `createGuard`, `vendoAutoJudge`,
`resolvePolicyConfig`, `permissionsHandler`, `parseOrgPolicyFile` and the rest
— is logic and stays in the umbrella.

`@vendoai/vendo` absorbs the runtime dependencies the two blocks brought with
them (`@e965/xlsx`, `fflate`, `unpdf`, and `just-bash`, which is a real
dependency now rather than a test-only one), and the claude-code harness's
optional `@anthropic-ai/claude-agent-sdk` peer.
