// @vitest-environment node
import { describe, expect, it } from "vitest";
import { POST } from "./route";

const request = (body: unknown) => new Request("http://localhost/api/receipts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const base = { meetingId: "m", principalId: "demo_product", eventId: "evt_1", acceptedWording: "Target Friday pending Legal approval.", factIds: ["F-LEGAL-1"], collisionId: "col_evt_1", graphPathIds: [] };
describe("POST /api/receipts", () => {
  it("creates a receipt only from server-owned authorised evidence", async () => {
    const response = await POST(request(base));
    expect(response.status).toBe(201);
    expect((await response.json()).evidenceSnapshot[0].factId).toBe("F-LEGAL-1");
  });
  it("rejects unknown evidence IDs", async () => {
    expect((await POST(request({ ...base, factIds: ["F-NOT-REAL"] }))).status).toBe(400);
  });
});
