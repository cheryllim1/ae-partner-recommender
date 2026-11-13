import { useState } from "react";
import { ChevronDown, Activity, AlertTriangle, TrendingUp, Send } from "lucide-react";
import { avgWinRate } from "@/lib/partner-engine";
import { ACTIVITIES, BLOCKER_CATEGORIES, type FrictionItem } from "./data";

export type LiveActivity = { activityId: string; timestamp: string; type: string; partnerName: string; description: string; status: string };

export function SummaryDrawer({ dispatches, activities, friction, onAddFriction, onFrictionStatus, dealOptions }: {
  dispatches: number; activities: LiveActivity[]; friction: FrictionItem[]; onAddFriction: (f: { deal: string; category: string; notes: string }) => void; onFrictionStatus: (id: string, s: FrictionItem["status"]) => void; dealOptions: string[];
}) {
  const [open, setOpen] = useState(true);
  const [deal, setDeal] = useState(dealOptions[0] ?? ""); const [cat, setCat] = useState<string>(BLOCKER_CATEGORIES[0] ?? "Other"); const [notes, setNotes] = useState("");
  const [filter, setFilter] = useState<"All" | FrictionItem["status"]>("All");
  const openCount = friction.filter((f) => f.status !== "Resolved").length;
  const feed = [...activities, ...ACTIVITIES].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const field = "h-9 w-full rounded border border-input bg-card px-2 text-sm";
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); if (!deal || !notes.trim()) return;
    onAddFriction({ deal, category: cat, notes: notes.trim() });
    setNotes("");
  };
  const stCls = { New: "bg-sky/15 text-sky", "In Progress": "bg-warning/20 text-foreground", Resolved: "bg-success/15 text-success" };
  return (
    <section className="mt-6 rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-4 text-left" aria-expanded={open}>
        <span className="font-bold">Management & Co-Sell Summary</span>
        <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-6 border-t border-border p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {[{ i: TrendingUp, l: `Avg Co-Sell Win Rate (604 partners)`, v: `${avgWinRate().toFixed(1)}%` }, { i: Send, l: "Active Slack Dispatches", v: dispatches }, { i: AlertTriangle, l: "Open Friction Escalations", v: openCount }].map(({ i: I, l, v }) => (
            <div key={l} className="rounded border border-border p-4"><I className="h-4 w-4 text-sky" /><p className="mt-2 text-2xl font-bold">{v}</p><p className="text-xs text-muted-foreground">{l}</p></div>))}
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Activity className="h-4 w-4 text-sky" />Recent Activity</h3>
            <ol className="max-h-96 space-y-3 overflow-y-auto border-l-2 border-border pl-4">
              {feed.slice(0, 20).map((a) => <li key={a.activityId} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-success" />
                <p className="text-sm font-semibold">{a.type} · <span className="font-normal">{a.partnerName}</span></p>
                <p className="text-xs text-muted-foreground">{a.description}</p>
                <p className="text-[11px] text-muted-foreground">{new Date(a.timestamp).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
              </li>)}
            </ol>
          </div>
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><AlertTriangle className="h-4 w-4 text-warning" />AE Friction & Escalation Tracker</h3>
            <form onSubmit={submit} className="grid gap-2 rounded border border-border bg-muted/40 p-3 sm:grid-cols-[1fr_1fr_2fr_auto]">
              <select aria-label="Deal name" className={field} value={deal} onChange={(e) => setDeal(e.target.value)}>{dealOptions.map((d) => <option key={d}>{d}</option>)}</select>
              <select aria-label="Blocker category" className={field} value={cat} onChange={(e) => setCat(e.target.value)}>{BLOCKER_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
              <input aria-label="Notes" placeholder="What's blocking partner engagement?" className={field} value={notes} onChange={(e) => setNotes(e.target.value)} />
              <button className="h-9 rounded bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Log</button>
            </form>
            <div className="mt-3 flex gap-1">{(["All", "New", "In Progress", "Resolved"] as const).map((f) =>
              <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === f ? "bg-navy text-navy-foreground" : "bg-muted text-muted-foreground"}`}>{f}</button>)}</div>
            <div className="mt-2 max-h-80 overflow-auto rounded border border-border">
              <table className="w-full text-sm"><thead className="sticky top-0 bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Deal</th><th className="px-3 py-2">Blocker</th><th className="px-3 py-2">Status</th></tr></thead>
                <tbody>{friction.filter((f) => filter === "All" || f.status === filter).map((f) => (
                  <tr key={f.id} className="border-t border-border align-top">
                    <td className="px-3 py-2"><p className="font-semibold">{f.deal}</p><p className="text-[11px] text-muted-foreground">{f.date}</p></td>
                    <td className="px-3 py-2"><p className="text-xs font-semibold">{f.category}</p><p className="text-xs text-muted-foreground">{f.notes}</p></td>
                    <td className="px-3 py-2"><select aria-label={`Status for ${f.id}`} value={f.status} onChange={(e) => onFrictionStatus(f.id, e.target.value as FrictionItem["status"])}
                      className={`rounded px-2 py-1 text-xs font-semibold ${stCls[f.status]}`}>{["New", "In Progress", "Resolved"].map((s) => <option key={s}>{s}</option>)}</select></td>
                  </tr>))}</tbody></table>
            </div>
          </div>
        </div>
      </div>}
    </section>
  );
}
