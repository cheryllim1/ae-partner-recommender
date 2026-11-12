import { describe, expect, it } from "vitest";
import { rankPartners, segmentFor, mapStage, STAGE_LOGIC } from "./partner-engine";

describe("partner engine", () => {
  it("classifies $250,000 as Enterprise and below as Mid-Market", () => {
    expect(segmentFor(250000)).toBe("Enterprise");
    expect(segmentFor(249999)).toBe("Mid-Market");
  });
  it("Proposal stage prioritises SI & Service Providers", () => {
    expect(STAGE_LOGIC["Proposal & Negotiation"].types).toEqual(["System Integrator", "Service Providers"]);
  });
  it("always returns 3 partners, even for a thin country", () => {
    const r = rankPartners({ account: "X", country: "Malta", product: "OpenText Fortify", amount: 100000, stage: "Closed-Won" });
    expect(r).toHaveLength(3);
    expect(r.some((s) => s.matchKind !== "exact")).toBe(true);
  });
  it("Germany proposal deal ranks a German partner of the stage's type first", () => {
    const [top] = rankPartners({ account: "N", country: "Germany", product: "OpenText Extended ECM (xECM)", amount: 480000, stage: "Proposal & Negotiation" });
    expect(top.partner.country).toBe("Germany");
    expect(["System Integrator", "Service Providers"]).toContain(top.partner.type);
  });
  it("maps CRM stage names", () => {
    expect(mapStage("Solution Design")).toBe("Technical Validation / POC");
    expect(mapStage("Negotiation")).toBe("Proposal & Negotiation");
  });
});
