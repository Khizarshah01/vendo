/**
 * Kit prop schemas + classing (W2 §The Kit).
 *
 * W3 hoisted the definitions to `@vendoai/vendo/core` so the generation engine can
 * consume the prop classes (law-1 enforcement) and the generated prompt;
 * this module re-exports them so the `@vendoai/vendo/ui/kit` surface is unchanged.
 */
export {
  config,
  copy,
  data,
  propsSchema,
  validateProps,
  type KitComponentSpec,
  type KitSlotSpec,
  type PropClass,
  type PropSpec,
} from "../../core/apps/index.js";
