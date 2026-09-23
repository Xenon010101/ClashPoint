import type { Graph } from "./model";
import type { EvidencePath } from "./query";

export type EvidencePathStep = { relation: string; label: string };

export function explainEvidencePath(graph: Graph, path: EvidencePath | null): EvidencePathStep[] {
  if (!path) return [];
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  return path.nodeIds.map((nodeId, index) => ({
    relation: index === 0 ? "concerns" : path.edges[index - 1]?.type.replaceAll("_", " ").toLowerCase() ?? "evidence",
    label: nodes.get(nodeId)?.label ?? nodeId,
  }));
}
