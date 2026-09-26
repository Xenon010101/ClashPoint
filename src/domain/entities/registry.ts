export type EntityRecord = { entityId: string; type: string; label: string; aliases: string[] };
export type EntityResolution =
  | { state: "resolved"; entity: EntityRecord }
  | { state: "ambiguous"; candidates: EntityRecord[] }
  | { state: "unresolved" };

const normalise = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

/** Stable alias lookup: an ambiguous label must abstain rather than create a duplicate entity. */
export function resolveEntityMention(mention: string, registry: EntityRecord[]): EntityResolution {
  const needle = normalise(mention);
  const candidates = registry.filter((entity) => [entity.label, ...entity.aliases].some((alias) => normalise(alias) === needle));
  if (candidates.length === 1) return { state: "resolved", entity: candidates[0] };
  return candidates.length > 1 ? { state: "ambiguous", candidates } : { state: "unresolved" };
}
