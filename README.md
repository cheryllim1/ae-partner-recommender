# AE Internal Tool: Partner Recommender

Build a focused tool that solves the problem described below, focusing purely on the core Account Executive Salesforce Opportunity workspace (without persona switchers):

MAKE IT YOURS
Who this tool is for: Mid-market and enterprise account executives at OpenText

The task it should help with: Finding the right channel partner for an active deal, reviewing win rates and instantly generating / dispatching 1-click outreach for top 3 partners.

How this works today: Most Account Executives are not motivated to bring partners into active deals. The ones who do are searching through OpenText Partner directories, manual spreadsheets, and pinging Partner Alliances managers / internal teams via fragmented emails. Many are not keen to bring partners in because they are unfamiliar with who our active, certified, and experienced partners are.

What goes wrong: Wasted time finding the right partners, confusion over which of OpenText's 6 partner programs fits the current deal stage, and low AE motivation because bringing partners in feels like extra work and lacks confidence/proof.

Who submits requests: Account Executives/ Sales reps

Information each request needs: Account Name, Country, OpenText Product Needed, Deal Amount ($), and active Salesforce Deal Stage (which automatically maps to OpenText's 6 Partner Programs: Reseller, Referral, Service Providers, Technology, Solution Extension, and System Integrators).

Workflow stages: Prospecting / Discovery, Technical Validation / POC, Proposal & Negotiation, Closed-Won (with outreach statuses: Recommended, Outreach Copied, Dispatched to Slack / PDE).

What success looks like: An AE opens an active deal in Salesforce, immediately sees the Top 3 best-fit certified partners ranked by Match Score % with clear win-rate proof, and dispatches a tailored Slack ping or intro email in under 10 seconds—while Partner Development Executives (PDEs) can view logged friction points and outreach status in one place.

Colors and style: OpenText enterprise brand aesthetic: OpenText Deep Navy (`#0B1F3A`) top bar, Corporate Blue (`#0066CC` with `#0052A3` hover) primary buttons, Sky Blue (`#0091DA`) accents, Emerald Green (`#10B981`) synced badges, and a crisp Light Cool Gray (`#F4F6F9`) canvas with pure white (`#FFFFFF`) elevated Salesforce-style cards. Load Google Font **Inter** as the primary font with **Arial, sans-serif** as the fallback (`font-family: 'Inter', Arial, sans-serif;`).

DATA SOURCES (USE THE ATTACHED CLEAN JSON FILES):
1. `opentext_clean_products.json`: Populate the OpenText Product dropdown and category groupings (Content, Experience, Cybersecurity, Business Network, IT Operations).
2. `opentext_clean_partners.json` (604 enriched records): Power the recommendation engine and partner directory, mapping: `name`, `country`, `region`, `tier` (Platinum, Gold, Silver, Authorized), `type` (Reseller, Referral, Service Providers, Technology, Solution Extension, System Integrators), `segmentFocus`, `productFocus`, `certifications`, `opportunities`, `closedWon`, `winRate`, `avgDealSize`, `partnerContact` (`name`, `role`, `email`), `outreachTemplate`, and `overview`.
3. `mock_deals.json`: Populate active opportunity presets with live `engagementStatus`, `frictionReason`, and fallback tags.
4. `mock_activities.json`: Power the co-sell activity timeline.

WHAT TO BUILD
Build a clean, 2-column embedded Salesforce Opportunity workspace (100% client-side):

1. **Left Column: Simulated Salesforce Opportunity Record (45% Width)**
   - **Preset Deal Switcher Bar at Top:** A dropdown to switch between European deals from `mock_deals.json` or the 4 presets (or edit fields live to test the recommendation engine):
     1. `OPP-8841 | NordVatten Energy (Germany) — $480,000 | Stage: Proposal & Negotiation`
     2. `OPP-8904 | Albion FinTech Ltd (United Kingdom) — $165,000 | Stage: Prospecting / Discovery`
     3. `OPP-9012 | Maison Lumière Retail (France) — $290,000 | Stage: Technical Validation / POC`
     4. `OPP-9105 | Iberia Telecom Group (Spain) — $620,000 | Stage: Proposal & Negotiation`
   - **Editable Opportunity Form Card:** Clean Salesforce Lightning style inputs:
     * **Account Name** (text input)
     * **Country** (dropdown matching European countries in dataset + Global)
     * **OpenText Product Needed** (dropdown populated from `opentext_clean_products.json`)
     * **Deal Amount ($)** (number input — automatically classifies `< $250,000` as Mid-Market and `>= $250,000` as Enterprise)
     * **Deal Stage** (dropdown: `Prospecting / Discovery`, `Technical Validation / POC`, `Proposal & Negotiation`, `Closed-Won`)
     * **Active Engagement Status Badge:** Live badge (`Not Contacted`, `Partner Engaged: Email Sent`, `Partner Engaged: Dispatched to Slack (Pending Reply)`) updating live with actions.
   - **Stage-to-Partner Logic Banner:** A plain-language callout showing how the active Deal Stage guides partner selection:
     * *Prospecting / Discovery* → Prioritizes **Referral & Reseller** partners (**Partner-Sourced / Early Co-Sell**).
     * *Technical Validation / POC* → Prioritizes **Technology & Solution Extension** partners (**Partner-Influenced** technical add-on).
     * *Proposal & Negotiation* → Prioritizes **System Integrators (SI) & Service Providers** (**Co-Delivery & Implementation**).
     * *Closed-Won* → Prioritizes **System Integrators & Service Providers** (**Post-Sale Deployment & Managed Services**).

2. **Right Column: "AE Partner Co-Pilot" Embedded Plugin Widget (55% Width)**
   - **Header & View Toggle:** Title `"Top 3 Recommended Partners"` with a secondary toggle button `"Browse All 604 Partners"` (paginated at 20 per page with search and filtering by name, country, tier, and partner program type).
   - **Smart Client-Side Ranking Engine (Top 3 Cards):**
     * Automatically score and rank partners whenever the Opportunity fields change on the left:
       - +40 pts if `country` matches or is included in partner's operating territory (fallback to regional/global if fewer than 3 exact matches exist, clearly marked with a *"Regional / EMEA Fallback Match"* pill so 3 cards always appear).
       - +25 pts if `type` aligns with the active Deal Stage's prioritized partner programs.
       - +20 pts if `productFocus` matches or relates to the selected OpenText Product.
       - +15 pts based on `winRate` and `segmentFocus` alignment (Enterprise vs. Mid-Market).
     * **Each of the Top 3 Partner Cards displays:**
       - Rank Badge (`#1 Best Match — 96% Score`), Partner Name, Tier Badge (`Platinum`, `Gold`, `Silver`, `Authorized`), and Program Type badge (`System Integrator`, `Reseller`, etc.).
       - **"Why Recommended" Tag:** Plain-language 1-line proof (e.g., *"Ideal for Proposal Stage • 44% Win Rate in Germany • 18 Certifications • 3 xECM Deals"*).
       - **Confidence Metrics Row:** Win Rate %, Closed-Won / Opportunities ratio (`closedWon`/`opportunities`), and formatted Avg Deal Size (`avgDealSize`).
       - **Partner Contact & 1-Click Actions:** Shows `partnerContact.name` & `email`, plus two large, mobile-friendly buttons:
         1. **"Copy Intro Email"** (copies a tailored email referencing the Opportunity Account Name, Deal Stage, and Partner Program role, showing a clear `"Copied!"` confirmation, and updates deal engagement status).
         2. **"⚡ Ping PDE on Slack"** (simulates dispatching to `#pde-deal-reg` with a 400ms spinner, a green confirmation toast: `"Dispatched to #pde-deal-reg & Partner Manager notified"`, and updates deal engagement status to `Partner Engaged: Dispatched to Slack (Pending Reply)`).

3. **Management & Summary Drawer (Collapsible Bottom Accordion)**
   - **Co-Sell Summary & Open Requests:** High-level KPIs (Average Co-Sell Win Rate across the 604 partners, Active Dispatches, and Open Friction Escalations).
   - **Recent Activity Feed:** Displays timeline of co-sell actions from `mock_activities.json`.
   - **AE Friction & Escalation Tracker:** A 3-field submission form (Deal Name, Blocker Category, Notes) paired with a management table showing submitted blockers, status badges (`New`, `In Progress`, `Resolved`), filters, and a 1-click status dropdown so Partner Alliances managers can update each item in one place.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ae-partner-recommender.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4cd3e4d9-588b-46fd-976d-c92a7c5893ce).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
