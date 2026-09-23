import { z } from "zod";

export const GraphNodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["entity", "fact", "source"]),
  label: z.string().min(1),
});

export const GraphEdgeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["ABOUT", "DEPENDS_ON", "REQUIRES_APPROVAL", "EVIDENCED_BY", "DERIVED_FROM"]),
  from: z.string().min(1),
  to: z.string().min(1),
  authority: z.enum(["context", "evidence"]),
  supportFactIds: z.array(z.string()),
  status: z.literal("active"),
});

export const GraphSchema = z.object({
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
});

export type GraphNode = z.infer<typeof GraphNodeSchema>;
export type GraphEdge = z.infer<typeof GraphEdgeSchema>;
export type Graph = z.infer<typeof GraphSchema>;
