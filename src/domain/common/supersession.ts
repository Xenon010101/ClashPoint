import { z } from "zod";

export const SupersessionSchema = z.object({
  state: z.enum(["active", "superseded"]),
  supersedes: z.array(z.string()),
  supersededBy: z.array(z.string()),
  effectiveFrom: z.string().datetime(),
  effectiveTo: z.string().datetime().nullable(),
  reason: z.string().nullable(),
  recordedAt: z.string().datetime().nullable(),
}).superRefine((value, context) => {
  if (value.state === "active" && value.effectiveTo !== null) {
    context.addIssue({ code: "custom", message: "Active records cannot have an effective end time." });
  }
  if (value.state === "superseded" && value.supersededBy.length === 0) {
    context.addIssue({ code: "custom", message: "Superseded records require a successor." });
  }
});

export type Supersession = z.infer<typeof SupersessionSchema>;
