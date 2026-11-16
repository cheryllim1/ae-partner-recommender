# OpenText AE Partner Recommender (Salesforce Opportunity Extension)

**Live Demo:** [ae-partner-recommender.lovable.app](https://ae-partner-recommender.lovable.app/)

An embedded Salesforce Extension/ Add-ons built to accelerate co-sell velocity and drive Account Executive (AE) partner adoption. Designed to emulate native enterprise CRM workflows, the tool recommends the **Top 3 best-fit OpenText ecosystem partners** directly within an active deal context, eliminating manual directory searches and enabling instant co-sell outreach.


---

## 🎯 The solution to the problem (The Operational Problem):

`This is built for the Sales Reps and AEs` Getting direct sales teams to consistently attach partners is one of the highest-leverage drivers—and biggest bottlenecks. <br>
1. **Eliminating Discovery Friction for AEs:** Instead of forcing reps to leave Salesforce to search spreadsheets or portals, the co-pilot dynamically evaluates [604 real OpenText partners](https://www.opentext.com/partners/partner-directory) against the active opportunity's territory, deal size, and OpenText product line (e.g., *Extended ECM, Cybersecurity, Analytics*). <br> 
2. **Data-Backed Partner Matching:** Recommendations are weighted and ranked to surface the **Top 3 partners** using historical commercial metrics:
   * **Historical Win Rate** (*Closed Won / Total Opportunities*)
   * **OpenText Membership Tier** (*Platinum, Gold, Silver, Bronze*)
   * **Average Deal Size Won** (*ensuring segment fit across Mid-Market and Enterprise deals*) <br>
3. **Zero-Friction Co-Sell Execution & Channel Hygiene:**
   * **One-Click Outreach:** AEs can immediately engage their chosen partner via deal-contextualized email drafts or direct Slack pings.
   * **Live Engagement Badges:** Displays real-time communication status like a Jira Board to prevent duplicate outreach and channel conflict.
   * **Regional Coverage Fallbacks:** When an opportunity sits in a lower-density territory with fewer than three local matches, the system automatically triggers a **`Contact Regional Partner Manager`** fallback alert so deals never stall.


---

## ✨ How is this useful (Key Features & Salesforce-Native UI)

### 1. Intelligent Partner Recommendation Engine
* Surfaces top-ranked partner matches categorised by OpenText tiers, certification depth, win rates and average deal size won.
* Generates pre-formatted, one-click outreach templates tailored to the specific deal stage and partner focus area for email or Slack.

### 2. Live Engagement Status Badges
* Tracks communication states directly on the opportunity card like a Jira Board to eliminate duplicate outreach and internal friction.

### 3. Transparent Regional Fallback Logic
* Automatically identifies when an opportunity sits in an underserved region with fewer than three local matches, instantly triggering a visible fallback alert: *Contact Regional Partner Manager*.

---

## 🛠️ The Boring Stuff (Data Engineering & Tech Stack)

* **Frontend & UI:** Built and deployed on **Lovable** (React, TypeScript, Tailwind CSS)
* **Data Pipeline & Enrichment:** **Python, Pandas, and Jupyter Notebook**
  * Downloaded and cleaned **604 real OpenText partner records** (`opentext_clean_partners.json`) and core product categories (`opentext_clean_products.json`) from OpenText Website.
  * Standardized membership hierarchies to OpenText's official 4-tier structure, migrating legacy `"Authorized"` labels to `"Bronze"`.
  * Generated mock opportunity states (`mock_deals.json`) to validate engagement status tracking and fallback routing.

---


