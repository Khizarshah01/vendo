/** Reads an operator variable, treating blank as unset.
 *
 *  Deliberately NOT trimmed, and deliberately shared: the wire resolves cloud
 *  configuration with this predicate and `vendo doctor` reports on it with the
 *  same one, so the two can never disagree about what counts as set. Guarded on
 *  `process`, because core is bundled for browser and edge targets. */
export function environment(name: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  const value = process.env[name];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
