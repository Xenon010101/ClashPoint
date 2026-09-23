import type { Graph, GraphEdge, GraphNode } from "./model";

/** Deterministic, in-memory projection store. It intentionally owns no source truth. */
export class GraphStore {
  private readonly nodesById = new Map<string, GraphNode>();
  private readonly edgesById = new Map<string, GraphEdge>();

  addNode(node: GraphNode) { this.nodesById.set(node.id, node); }
  addEdge(edge: GraphEdge) { this.edgesById.set(edge.id, edge); }

  snapshot(): Graph {
    return {
      nodes: [...this.nodesById.values()].sort((a, b) => a.id.localeCompare(b.id)),
      edges: [...this.edgesById.values()].sort((a, b) => a.id.localeCompare(b.id)),
    };
  }
}
