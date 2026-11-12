import partnersRaw from "@/data/opentext_clean_partners.json";
import productsRaw from "@/data/opentext_clean_products.json";

export type Partner = (typeof partnersRaw)[number];
export type Product = (typeof productsRaw)[number];
export const PARTNERS = partnersRaw as Partner[];
export const PRODUCTS = productsRaw as Product[];

export const STAGES = [
  "Prospecting / Discovery",
  "Technical Validation / POC",
  "Proposal & Negotiation",
  "Closed-Won",
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LOGIC: Record<Stage, { types: string[]; label: string; motion: string }> = {
  "Prospecting / Discovery": { types: ["Referral", "Reseller"], label: "Referral & Reseller", motion: "Partner-Sourced / Early Co-Sell" },
  "Technical Validation / POC": { types: ["Technology", "Solution Extension"], label: "Technology & Solution Extension", motion: "Partner-Influenced technical add-on" },
  "Proposal & Negotiation": { types: ["System Integrator", "Service Providers"], label: "System Integrators (SI) & Service Providers", motion: "Co-Delivery & Implementation" },
  "Closed-Won": { types: ["System Integrator", "Service Providers"], label: "System Integrators & Service Providers", motion: "Post-Sale Deployment & Managed Services" },
};

export function mapStage(s: string): Stage {
  if (/discovery|prospect/i.test(s)) return "Prospecting / Discovery";
  if (/design|technical|poc/i.test(s)) return "Technical Validation / POC";
  if (/closed/i.test(s)) return "Closed-Won";
  return "Proposal & Negotiation";
}

export const segmentFor = (amount: number) => (amount >= 250000 ? "Enterprise" : "Mid-Market");

const COUNTRY_REGION: Record<string, string> = {
  Germany: "DACH", Austria: "DACH", Switzerland: "DACH", Liechtenstein: "DACH",
  "United Kingdom": "UK", Ireland: "UK", France: "France", Spain: "Iberia", Portugal: "Iberia",
  Italy: "Italy", Malta: "Southern Europe", Greece: "Southern Europe", Cyprus: "Southern Europe",
  Belgium: "Benelux", Netherlands: "Benelux", Luxembourg: "Benelux",
  Denmark: "Nordics", Sweden: "Nordics", Norway: "Nordics", Finland: "Nordics", Iceland: "Nordics",
  Estonia: "Northern Europe", Latvia: "Northern Europe", Lithuania: "Northern Europe",
  Poland: "Central & Eastern Europe", "Czech Republic": "Central & Eastern Europe", Hungary: "Central & Eastern Europe",
  Romania: "Central & Eastern Europe", Bulgaria: "Central & Eastern Europe", Slovakia: "Central & Eastern Europe",
  Slovenia: "Central & Eastern Europe", Croatia: "Central & Eastern Europe", Serbia: "Central & Eastern Europe",
  "Bosnia and Herzegovina": "Central & Eastern Europe", Albania: "Central & Eastern Europe", Ukraine: "Central & Eastern Europe",
};
export const EUROPE = Object.keys(COUNTRY_REGION);
export const COUNTRIES = [
  ...Array.from(new Set([...PARTNERS.map((p) => p.country), "Luxembourg", "Estonia", "Malta"]))
    .filter((c) => EUROPE.includes(c)).sort(),
  "Global",
];

const PRODUCT_KEYWORDS: Record<string, string[]> = {
  Content: ["Content"], Experience: ["Experience"], Cybersecurity: ["Cybersecurity"],
  "Business Network": ["Business Network"], "IT Operations": ["IT Operations", "Application Delivery"],
};

export type Opportunity = { account: string; country: string; product: string; amount: number; stage: Stage };
export type Scored = { partner: Partner; score: number; matchKind: "exact" | "regional" | "global"; why: string };

const regionTokens = (p: Partner) => p.region.split(",").map((r) => r.trim()).filter(Boolean);
export const shortProduct = (name: string) => name.match(/\(([^)]+)\)/)?.[1] ?? name.replace("OpenText ", "");

export function scorePartner(p: Partner, opp: Opportunity): Scored {
  const product = PRODUCTS.find((x) => x.name === opp.product);
  const region = COUNTRY_REGION[opp.country];
  const tokens = regionTokens(p);
  let geo = 0;
  let matchKind: Scored["matchKind"] = "global";
  if (opp.country === "Global" ? tokens.includes("Global") : p.country === opp.country) { geo = 40; matchKind = "exact"; }
  else if (region && (tokens.includes(region) || COUNTRY_REGION[p.country] === region)) { geo = 28; matchKind = "regional"; }
  else if (tokens.includes("Global")) geo = 20;
  else if (EUROPE.includes(p.country) || tokens.some((t) => /Europe|DACH|UK|Benelux|France|Iberia|Italy|Nordics/.test(t))) geo = 12;
  const typeFit = STAGE_LOGIC[opp.stage].types.includes(p.type) ? 25 : 0;
  const kw = product ? PRODUCT_KEYWORDS[product.category] ?? [] : [];
  const focus = p.productFocus ?? "";
  const productFit = kw.some((k) => focus.includes(k)) ? 20 : /Portfolio/.test(focus) ? 12 : 0;
  const perf = Math.min(10, (p.winRate / 50) * 10) + (p.segmentFocus === segmentFor(opp.amount) ? 5 : 0);
  const score = Math.min(99, Math.round(geo + typeFit + productFit + perf));
  const stageShort = opp.stage.split(" ")[0];
  const bits = [
    typeFit ? `Ideal for ${stageShort} Stage` : `${p.type} partner`,
    `${p.winRate}% Win Rate in ${p.country}`,
    `${p.certifications} Certification${p.certifications === 1 ? "" : "s"}`,
    `${p.closedWon} ${product ? shortProduct(product.name) : ""} Deals Won`.replace("  ", " "),
  ];
  return { partner: p, score, matchKind, why: bits.join(" • ") };
}

export function rankPartners(opp: Opportunity, n = 3): Scored[] {
  return PARTNERS.map((p) => scorePartner(p, opp))
    .sort((a, b) => b.score - a.score || b.partner.winRate - a.partner.winRate)
    .slice(0, n);
}

export function buildIntroEmail(s: Scored, opp: Opportunity, ae = "[AE Name]") {
  const c = s.partner.partnerContact;
  const role = STAGE_LOGIC[opp.stage];
  return `Subject: OpenText Co-Sell – ${opp.account} (${shortProduct(opp.product)})

Hi ${c.name.split(" ")[0]},

I'm the OpenText AE on ${opp.account} in ${opp.country}, a ${segmentFor(opp.amount)} opportunity (~$${opp.amount.toLocaleString("en-US")}) for ${opp.product}, currently at the ${opp.stage} stage.

At this stage we're bringing in a ${s.partner.type} partner for ${role.motion.toLowerCase()}. Given ${s.partner.name}'s ${s.partner.tier} status, ${s.partner.winRate}% win rate and ${s.partner.closedWon} closed-won OpenText deals, you're our top fit.

Could we align for 15 minutes this week?

Best,
${ae}`;
}

export const avgWinRate = () => PARTNERS.reduce((a, p) => a + p.winRate, 0) / PARTNERS.length;
export const fmtMoney = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${Math.round(n / 1000)}K`);
