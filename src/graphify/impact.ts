import type { Graph, GraphEdge } from "./model";

export type ImpactPath = { nodeIds: string[]; edges: GraphEdge[]; factIds: string[] };

/** Finds work that depends on a changed prerequisite using a bounded, cycle-safe reverse traversal. */
export function findDependents(graph: Graph, changedId: string, maxDepth = 5): ImpactPath[] {
  const incoming = new Map<string, GraphEdge[]>();
  for (const edge of graph.edges.filter((edge) => edge.type === "DEPENDS_ON")) incoming.set(edge.to, [...(incoming.get(edge.to) ?? []), edge]);
  const queue = [{ nodeIds: [changedId], edges: [] as GraphEdge[] }];
  const seen = new Set([changedId]);
  const results: ImpactPath[] = [];
  while (queue.length) {
    const current = queue.shift()!;
    const node = current.nodeIds.at(-1)!;
    if (current.edges.length >= maxDepth) continue;
    for (const edge of incoming.get(node) ?? []) {
      if (seen.has(edge.from)) continue;
      seen.add(edge.from);
      const next = { nodeIds: [...current.nodeIds, edge.from], edges: [...current.edges, edge] };
      results.push({ ...next, factIds: [...new Set(next.edges.flatMap((item) => item.supportFactIds))] });
      queue.push(next);
    }
  }
  return results;
}
