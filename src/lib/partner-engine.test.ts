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
    const top = ( rankPartners({ account: "N", country: "Germany", product: "OpenText Extended ECM (xECM)", amount: 480000, stage: "Proposal & Negotiation" }))[0]!;
    expect(top.partner.country).toBe("Germany");
    expect(["System Integrator", "Service Providers"]).toContain(top.partner.type);
  });
  it("maps CRM stage names", () => {
    expect(mapStage("Solution Design")).toBe("Technical Validation / POC");
    expect(mapStage("Negotiation")).toBe("Proposal & Negotiation");
  });
});

import { outcomeBoosts, isFollowUpDue, rankWithHistory, rankPartners as rp } from "./partner-engine";
describe("win/loss learning", () => {
  it("adds 3 per win and subtracts 3 per loss", () => {
    expect(outcomeBoosts([{ partnerId: "a", outcome: "Won" }, { partnerId: "a", outcome: "Won" }, { partnerId: "b", outcome: "Lost" }])).toEqual({ a: 6, b: -3 });
  });
  it("caps the nudge at ±9", () => {
    expect(outcomeBoosts(Array(5).fill({ partnerId: "a", outcome: "Won" }))["a"]).toBe(9);
    expect(outcomeBoosts(Array(5).fill({ partnerId: "a", outcome: "Lost" }))["a"]).toBe(-9);
  });
  it("a heavily lost partner drops out of the top spot", () => {
    const opp = { account: "X", country: "Germany", product: "OpenText Extended ECM (xECM)", amount: 480000, stage: "Proposal & Negotiation" as const };
    const top = rp(opp)[0]!.partner.id;
    expect(rankWithHistory(opp, { [top]: -9 })[0]!.partner.id).not.toBe(top);
  });
});
describe("follow-up reminders", () => {
  const now = new Date("2026-11-13T12:00:00Z");
  it("is due after 3 days without a reply", () => expect(isFollowUpDue("2026-11-10T12:00:00Z", false, now)).toBe(true));
  it("is not due before 3 days", () => expect(isFollowUpDue("2026-11-11T12:00:00Z", false, now)).toBe(false));
  it("is never due once replied", () => expect(isFollowUpDue("2026-11-01T12:00:00Z", true, now)).toBe(false));
});
