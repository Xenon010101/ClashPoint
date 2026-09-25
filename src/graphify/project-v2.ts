import type { FactV2 } from "@/domain/facts/schema";
import type { Graph } from "./model";
import { GraphStore } from "./store";

const labelFor = (id: string) => id.split(":").slice(1).join(" ").replace(/[-_]/g, " ") || id;

/** Projects authorised active v2 facts; source state remains canonical outside the graph. */
export function projectFactsV2(facts: FactV2[]): Graph {
  const store = new GraphStore();
  for (const fact of facts.filter((item) => item.status === "active")) {
    const factNode = `fact:${fact.factId}`;
    const sourceNode = fact.sourceObjectId;
    store.addNode({ id: fact.subjectRef, type: "entity", label: labelFor(fact.subjectRef) });
    if (fact.objectRef) store.addNode({ id: fact.objectRef, type: "entity", label: labelFor(fact.objectRef) });
    store.addNode({ id: factNode, type: "fact", label: fact.statementVerbatim });
    store.addNode({ id: sourceNode, type: "source", label: sourceNode });
    store.addEdge({ id: `evidence:${fact.factId}`, type: "EVIDENCED_BY", from: fact.subjectRef, to: factNode, authority: "evidence", supportFactIds: [fact.factId], status: "active" });
    store.addEdge({ id: `derived:${fact.factId}`, type: "DERIVED_FROM", from: factNode, to: sourceNode, authority: "evidence", supportFactIds: [fact.factId], status: "active" });
    if (fact.objectRef && fact.predicate === "depends_on") {
      store.addEdge({ id: `dependency:${fact.factId}`, type: "DEPENDS_ON", from: fact.subjectRef, to: fact.objectRef, authority: "evidence", supportFactIds: [fact.factId], status: "active" });
    }
    if (fact.objectRef && fact.predicate === "requires_approval") {
      store.addEdge({ id: `approval:${fact.factId}`, type: "REQUIRES_APPROVAL", from: fact.subjectRef, to: fact.objectRef, authority: "evidence", supportFactIds: [fact.factId], status: "active" });
    }
  }
  return store.snapshot();
}
