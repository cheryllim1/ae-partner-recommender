import dealsRaw from "@/data/mock_deals.json";
import activitiesRaw from "@/data/mock_activities.json";
import { PRODUCTS, mapStage, type Opportunity } from "@/lib/partner-engine";

export type EngagementStatus = "Not Contacted" | "Partner Engaged: Email Sent" | "Partner Engaged: Dispatched to Slack (Pending Reply)" | "Partner Accepted: Co-Sell Active" | `Partner Assigned: ${string}`;
export type Preset = Opportunity & { id: string; status: EngagementStatus; friction?: string | null; fallback?: boolean };

const matchProduct = (n: string) =>
  PRODUCTS.find((p) => p.name === n)?.name ??
  PRODUCTS.find((p) => p.name.startsWith(n) || n.startsWith(p.name.split(" (")[0] ?? p.name))?.name ??
  PRODUCTS[0]!.name;

const normStatus = (s: string): EngagementStatus =>
  s.startsWith("Partner Engaged: Email") ? "Partner Engaged: Email Sent" : (s as EngagementStatus);

export const PRESETS: Preset[] = [
  { id: "OPP-8841", account: "NordVatten Energy", country: "Germany", product: "OpenText Extended ECM (xECM)", amount: 480000, stage: "Proposal & Negotiation", status: "Not Contacted" },
  { id: "OPP-8904", account: "Albion FinTech Ltd", country: "United Kingdom", product: "OpenText Fortify", amount: 165000, stage: "Prospecting / Discovery", status: "Not Contacted" },
  { id: "OPP-9012", account: "Maison Lumière Retail", country: "France", product: "OpenText Exstream", amount: 290000, stage: "Technical Validation / POC", status: "Not Contacted" },
  { id: "OPP-9105", account: "Iberia Telecom Group", country: "Spain", product: "OpenText Service Management Automation X (SMAX)", amount: 620000, stage: "Proposal & Negotiation", status: "Not Contacted" },
  ...dealsRaw.map((d) => ({
    id: d.dealId, account: d.endCustomer, country: d.customerCountry, product: matchProduct(d.productName),
    amount: d.dealValueUSD, stage: mapStage(d.stage), status: normStatus(d.engagementStatus),
    friction: d.frictionReason, fallback: d.isFallbackMatch,
  })),
];

export const ACTIVITIES = activitiesRaw;

export type FrictionItem = { id: string; deal: string; category: string; notes: string; status: "New" | "In Progress" | "Resolved"; date: string };
export const BLOCKER_CATEGORIES = ["Partner Unresponsive", "Tier Mismatch", "No Certified Partner in Territory", "Deal Registration Conflict", "Program Confusion", "Other"];
export const SEED_FRICTION: FrictionItem[] = dealsRaw
  .filter((d) => d.hasFrictionEscalation && d.frictionReason)
  .map((d, i) => ({
    id: `FR-${100 + i}`, deal: `${d.dealId} | ${d.endCustomer}`,
    category: BLOCKER_CATEGORIES.find((c) => d.frictionReason!.startsWith(c.split(" ")[0] ?? c)) ?? "Other",
    notes: d.frictionReason!, status: (["New", "In Progress", "Resolved"] as const)[i % 3]!, date: d.createdDate,
  }));
