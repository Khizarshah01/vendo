"use client";

/**
 * A page that renders a Vendo CLIENT surface, and prerenders it.
 *
 * This exists so `next build` has to resolve `@vendoai/vendo/react` through the
 * client boundary while building the server graph. Externalizing the umbrella
 * in `serverExternalPackages` breaks exactly this and nothing else the seam
 * touches: the doors still resolve, typecheck passes, the dev server serves —
 * and the production build dies in prerender on a null React dispatcher.
 */
import { VendoProvider } from "@vendoai/vendo/react";

export default function VendoSurfacePage() {
  return <VendoProvider><main>vendo surface</main></VendoProvider>;
}
