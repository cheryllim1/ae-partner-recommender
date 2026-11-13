import { Building2, Info, UserCheck, X, RefreshCw } from "lucide-react";
import type { Partner } from "@/lib/partner-engine";
import { TierBadge, TypeBadge } from "./CoPilot";
import { COUNTRIES, PRODUCTS, STAGES, STAGE_LOGIC, segmentFor, type Opportunity, type Stage } from "@/lib/partner-engine";
import type { EngagementStatus, Preset } from "./data";

const field = "w-full h-8 rounded border border-sf-border bg-card px-3 text-sm text-sf-text focus:outline-none focus:border-sf-blue focus:ring-1 focus:ring-sf-blue";
const label = "block text-xs text-sf-label mb-1";

export function StatusBadge({ status }: { status: EngagementStatus }) {
  const cls = status === "Not Contacted" ? "bg-muted text-muted-foreground"
    : status.includes("Slack") ? "bg-warning/15 text-foreground border border-warning/40"
    : "bg-success/15 text-success border border-success/40";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${status === "Not Contacted" ? "bg-muted-foreground" : status.includes("Slack") ? "bg-warning" : "bg-success"}`} />{status}
  </span>;
}

export function OpportunityPanel({ presetId, presets, onPreset, opp, onChange, status, partner, onChangePartner, onClearPartner }: {
  presetId: string; presets: Preset[]; onPreset: (id: string) => void;
  opp: Opportunity; onChange: (o: Opportunity) => void; status: EngagementStatus;
  partner?: Partner | undefined; onChangePartner: () => void; onClearPartner: () => void;
}) {
  const logic = STAGE_LOGIC[opp.stage];
  const seg = segmentFor(opp.amount || 0);
  const cats = Array.from(new Set(PRODUCTS.map((p) => p.category)));
  return (
    <div className="space-y-4">
      <div className="rounded bg-card p-3 border border-sf-border shadow-sm text-sf-text">
        <label className={label} htmlFor="preset">Active Opportunity</label>
        <select id="preset" className={field} value={presetId} onChange={(e) => onPreset(e.target.value)}>
          <optgroup label="Featured EMEA Deals">
            {presets.slice(0, 4).map((p) => <option key={p.id} value={p.id}>{`${p.id} | ${p.account} (${p.country}) — $${p.amount.toLocaleString("en-US")} | Stage: ${p.stage}`}</option>)}
          </optgroup>
          <optgroup label="Pipeline (mock_deals)">
            {presets.slice(4).map((p) => <option key={p.id} value={p.id}>{`${p.id} | ${p.account} (${p.country}) — $${p.amount.toLocaleString("en-US")} | ${p.stage}`}</option>)}
          </optgroup>
        </select>
      </div>

      <div className="rounded bg-card border border-sf-border shadow-sm text-sf-text">
        <div className="flex items-center gap-3 border-b border-sf-border bg-sf-gray/60 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-sf-orange text-primary-foreground"><Building2 className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-sf-label">Opportunity · {presetId}</p>
            <h2 className="truncate text-lg font-bold">{opp.account || "Untitled"}</h2>
          </div>
          <span className="rounded border border-sf-border bg-card px-2 py-1 text-xs font-semibold text-sf-label">{seg}</span>
        </div>
        <div className="grid grid-cols-2 gap-4 p-4">
          <div className="col-span-2"><label className={label} htmlFor="acct">Account Name</label>
            <input id="acct" className={field} value={opp.account} onChange={(e) => onChange({ ...opp, account: e.target.value })} /></div>
          <div><label className={label} htmlFor="country">Country</label>
            <select id="country" className={field} value={opp.country} onChange={(e) => onChange({ ...opp, country: e.target.value })}>
              {COUNTRIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label className={label} htmlFor="amt">Deal Amount ($)</label>
            <input id="amt" type="number" min={0} step={5000} className={field} value={opp.amount} onChange={(e) => onChange({ ...opp, amount: Number(e.target.value) })} /></div>
          <div className="col-span-2"><label className={label} htmlFor="prod">OpenText Product Needed</label>
            <select id="prod" className={field} value={opp.product} onChange={(e) => onChange({ ...opp, product: e.target.value })}>
              {cats.map((c) => <optgroup key={c} label={c}>{PRODUCTS.filter((p) => p.category === c).map((p) => <option key={p.id}>{p.name}</option>)}</optgroup>)}
            </select></div>
          <div className="col-span-2"><label className={label} htmlFor="stage">Deal Stage</label>
            <select id="stage" className={field} value={opp.stage} onChange={(e) => onChange({ ...opp, stage: e.target.value as Stage })}>
              {STAGES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div className="col-span-2 flex items-center justify-between gap-2 rounded bg-sf-gray px-3 py-2">
            <span className="text-xs text-sf-label">Engagement Status</span><StatusBadge status={status} /></div>
        </div>
        <div className="flex gap-1 border-t border-sf-border p-3">
          {STAGES.map((st, i) => {
            const idx = STAGES.indexOf(opp.stage);
            const cls = i < idx ? "bg-sf-green text-primary-foreground" : i === idx ? "bg-sf-blue-dark text-primary-foreground" : "bg-sf-gray text-sf-label";
            return <div key={st} style={{ clipPath: i === 0 ? "polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)" : "polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%, 8px 50%)" }}
              className={`flex flex-1 items-center justify-center gap-1 py-1.5 text-[11px] font-semibold ${cls} ${i === 0 ? "rounded-l-full" : ""}`}>{i < idx ? "✓" : st.split(" ")[0]}</div>;
          })}
        </div>
      </div>

      <section aria-label="Primary Co-Sell Partner" className="rounded border border-sf-border bg-card p-4 shadow-sm text-sf-text">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-sf-label"><UserCheck className="h-4 w-4 text-sf-blue" />Primary Co-Sell Partner</p>
        {partner ? (<>
          <div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-bold">{partner.name}</h3><TierBadge tier={partner.tier} /><TypeBadge type={partner.type} /></div>
          <p className="mt-1 text-xs text-muted-foreground">{partner.partnerContact.name} · {partner.partnerContact.email}</p>
          <p className="mt-1 text-xs"><strong>{partner.winRate}%</strong> win rate · <strong>{partner.closedWon}</strong> deals won</p>
          <div className="mt-3 flex gap-2">
            <button onClick={onChangePartner} className="flex h-9 items-center gap-1.5 rounded border border-sf-border px-3 text-sm font-semibold text-sf-blue hover:bg-sf-gray"><RefreshCw className="h-3.5 w-3.5" />Change Partner</button>
            <button onClick={onClearPartner} className="flex h-9 items-center gap-1.5 rounded border border-sf-border px-3 text-sm font-semibold text-sf-blue hover:bg-sf-gray"><X className="h-3.5 w-3.5" />Clear</button>
          </div>
        </>) : <p className="text-sm text-muted-foreground">No partner assigned yet — use "Select & Confirm Partner" on a recommendation.</p>}
      </section>

      <div className="rounded-lg border border-sky/40 bg-accent p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky" />
          <div className="text-sm">
            <p className="font-semibold">Stage-to-Partner Logic</p>
            <p className="mt-1 text-foreground/80"><em>{opp.stage}</em> → prioritizes <strong>{logic.label}</strong> partners (<strong>{logic.motion}</strong>).</p>
            <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
              {STAGES.map((s) => <li key={s} className={s === opp.stage ? "font-semibold text-accent-foreground" : ""}>{s} → {STAGE_LOGIC[s].label}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
