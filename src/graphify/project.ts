import type { Fact } from "@/lib/schemas";
import { GraphStore } from "./store";
import type { Graph } from "./model";

const labelFor = (id: string) => id.split(":").slice(1).join(" ").replace(/[-_]/g, " ") || id;

function sourceNodeId(fact: Fact) { return `source:${fact.sourceSystem}:${fact.sourceObjectId}`; }

/** Projects already-authorised, active facts. Contextual conversation cannot become evidence here. */
export function projectFacts(facts: Fact[]): Graph {
  const store = new GraphStore();
  for (const fact of facts.filter((item) => item.status === "active")) {
    const factNodeId = `fact:${fact.factId}`;
    const sourceId = sourceNodeId(fact);
    store.addNode({ id: factNodeId, type: "fact", label: fact.statementVerbatim });
    store.addNode({ id: sourceId, type: "source", label: fact.sourceTitle });
    store.addEdge({
      id: `derived:${fact.factId}`,
      type: "DERIVED_FROM",
      from: factNodeId,
      to: sourceId,
      authority: "evidence",
      supportFactIds: [fact.factId],
      status: "active",
    });

    for (const entityId of fact.entityKeys) {
      store.addNode({ id: entityId, type: "entity", label: labelFor(entityId) });
      store.addEdge({
        id: `evidence:${entityId}:${fact.factId}`,
        type: "EVIDENCED_BY",
        from: entityId,
        to: factNodeId,
        authority: "evidence",
        supportFactIds: [fact.factId],
        status: "active",
      });
    }

    if (fact.factType === "dependency" && fact.entityKeys.length >= 2) {
      const from = fact.entityKeys.find((key) => key.startsWith("feature:")) ?? fact.entityKeys[0];
      const to = fact.entityKeys.find((key) => key.startsWith("issue:")) ?? fact.entityKeys[1];
      store.addEdge({ id: `dependency:${from}:${to}`, type: "DEPENDS_ON", from, to, authority: "evidence", supportFactIds: [fact.factId], status: "active" });
    }
    if (fact.factType === "approval_blocker") {
      const from = fact.entityKeys.find((key) => key.startsWith("feature:")) ?? fact.entityKeys[0];
      if (from) store.addEdge({ id: `approval:${from}:${factNodeId}`, type: "REQUIRES_APPROVAL", from, to: factNodeId, authority: "evidence", supportFactIds: [fact.factId], status: "active" });
    }
  }
  return store.snapshot();
}
