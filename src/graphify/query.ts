import type { Graph, GraphEdge } from "./model";

export type EvidencePath = { pathId: string; nodeIds: string[]; edges: GraphEdge[]; factIds: string[] };

/** Bounded, directed breadth-first search. A visited set makes cyclic projections safe. */
export function findEvidencePath(graph: Graph, startIds: string[], factIds: string[], maxDepth = 5): EvidencePath | null {
  const targetIds = new Set(factIds.map((id) => `fact:${id}`));
  const outgoing = new Map<string, GraphEdge[]>();
  for (const edge of graph.edges) outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge]);
  const queue = startIds.map((id) => ({ nodeIds: [id], edges: [] as GraphEdge[] }));
  const visited = new Set(startIds);
  while (queue.length) {
    const current = queue.shift()!;
    const last = current.nodeIds.at(-1)!;
    if (targetIds.has(last)) {
      const supporting = [...new Set(current.edges.flatMap((edge) => edge.supportFactIds))];
      return { pathId: `path:${current.nodeIds.join("->")}`, nodeIds: current.nodeIds, edges: current.edges, factIds: supporting };
    }
    if (current.edges.length >= maxDepth) continue;
    for (const edge of outgoing.get(last) ?? []) {
      if (visited.has(edge.to)) continue;
      visited.add(edge.to);
      queue.push({ nodeIds: [...current.nodeIds, edge.to], edges: [...current.edges, edge] });
    }
  }
  return null;
}
