import { describe, expect, it } from "vitest";
import { resolveEntityMention } from "./registry";

const registry = [
  { entityId: "feature:sso", type: "feature", label: "Single sign-on", aliases: ["SSO"] },
  { entityId: "project:phoenix-web", type: "project", label: "Phoenix", aliases: [] },
  { entityId: "project:phoenix-api", type: "project", label: "Phoenix", aliases: [] },
];
describe("entity alias registry", () => {
  it("resolves an unambiguous alias to a stable ID", () => expect(resolveEntityMention("sso", registry)).toMatchObject({ state: "resolved", entity: { entityId: "feature:sso" } }));
  it("abstains when one label maps to multiple entities", () => expect(resolveEntityMention("Phoenix", registry)).toMatchObject({ state: "ambiguous" }));
});
