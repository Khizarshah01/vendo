import { z } from "zod";
import { VENDO_POLICY_FORMAT } from "./formats.js";
import type { GuardDecision } from "./guard.js";
import type { RunContext } from "./run-context.js";
import { riskLabelSchema, type RiskLabel, type ToolCall, type ToolDescriptor } from "./tools.js";

export interface PolicyRule {
  match: {
    tool?: string;
    risk?: RiskLabel;
    venue?: RunContext["venue"];
    presence?: RunContext["presence"];
  };
  action: "run" | "ask" | "block";
  note?: string;
}

export type PolicyFn = (
  call: ToolCall,
  descriptor: ToolDescriptor,
  ctx: RunContext,
) => GuardDecision | undefined;

/** Named policy presets: pure sugar that expands to rules before evaluation
 *  (00-overview decision 8). "cautious" asks before write/destructive and
 *  runs read; "readonly" runs read and blocks everything else; "autopilot"
 *  explicitly runs everything — still fully audited, and distinct from
 *  leaving `policy` unset (which reports the "unconfigured" posture). */
export type PolicyPresetName = "cautious" | "readonly" | "autopilot";

export interface PolicyConfigObject {
  file?: string;
  rules?: PolicyRule[];
  directions?: string[];
  code?: PolicyFn;
}

export type PolicyConfig = PolicyPresetName | PolicyConfigObject;

export interface PolicyFile {
  format: typeof VENDO_POLICY_FORMAT;
  directions?: string[];
  rules?: PolicyRule[];
}

export const policyRuleSchema = z
  .object({
    match: z
      .object({
        tool: z.string().optional(),
        risk: riskLabelSchema.optional(),
        venue: z.enum(["chat", "app", "automation", "mcp"]).optional(),
        presence: z.enum(["present", "away"]).optional(),
      })
      .strict(),
    action: z.enum(["run", "ask", "block"]),
    note: z.string().optional(),
  })
  .strict() satisfies z.ZodType<PolicyRule>;

export const policyFileSchema = z
  .object({
    format: z.literal(VENDO_POLICY_FORMAT),
    directions: z.array(z.string()).optional(),
    rules: z.array(policyRuleSchema).optional(),
  })
  .strict() satisfies z.ZodType<PolicyFile>;
