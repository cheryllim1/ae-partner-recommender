# OpenText AE Partner Recommender (Salesforce Opportunity Extension)

**Live Demo:** [ae-partner-recommender.lovable.app](https://ae-partner-recommender.lovable.app/)
---
## 🎯 The Business Challenge
Driving partner-contributed pipeline often breaks down at the execution layer:
* **Visibility Gaps:** AEs frequently struggle to identify which ecosystem partners are the right fit for an active deal.
* **Workflow Friction:** Sourcing partner alignment requires jumping across disparate directories, slowing down deal velocity.
* **Internal Adoption:** If co-selling isn't frictionless inside the daily CRM workflow, AEs default to direct-only motions.

### 💡 The Solution
The AE-Partner Recommender is built as an embedded Salesforce add-on that bridges the gap between sales execution and partner ecosystems. It automatically matches active deal criteria with qualified partners and shows key stakeholder contacts instantly within the CRM environment.

---

## 🚀 Key Capabilities
* **Deal-Level Matching:** Instantly queries active sales criteria to recommend high-probability partner synergies.
* **Internal Contact Routing:** Pulls up direct partner POCs and enablement resources to accelerate joint outreach.
* **Workflow Reduction:** Keeps AEs inside their primary CRM workspace, drastically lowering the barrier to ecosystem engagement.
---

## 🛠️ The Boring Stuff (Data Engineering & Tech Stack)

* **Frontend & UI:** Built and deployed on **Lovable** (React, TypeScript, Tailwind CSS)
* **Data Pipeline & Enrichment:** **Python, Pandas, and Jupyter Notebook**
  * Downloaded and cleaned **604 real OpenText partner records** (`opentext_clean_partners.json`) and core product categories (`opentext_clean_products.json`) from OpenText Website.
  * Standardized membership hierarchies to OpenText's official 4-tier structure, migrating legacy `"Authorized"` labels to `"Bronze"`.
  * Generated mock opportunity states (`mock_deals.json`) to validate engagement status tracking and fallback routing. In short, these are fake data.

---


