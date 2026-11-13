import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { BellRing, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/copilot/AppHeader";
import { PRESETS } from "@/components/copilot/data";
import { PARTNERS, fmtMoney, isFollowUpDue } from "@/lib/partner-engine";
import { useWorkspace } from "@/hooks/use-workspace";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Co-Sell Pipeline Board — AE Partner Co-Pilot" },
      { name: "description", content: "Every OpenText opportunity by partner engagement status, from not contacted to won or lost." },
      { property: "og:title", content: "Co-Sell Pipeline Board — AE Partner Co-Pilot" },
      { property: "og:description", content: "Track partner engagement and outcomes across all active deals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pipeline,
});

const COLS = ["Not Contacted", "Engaged", "Partner Assigned", "Won", "Lost"] as const;
type Col = (typeof COLS)[number];

function Pipeline() {
  const ws = useWorkspace();
  const cards = useMemo(() => PRESETS.map((p) => {
    const d = ws.dealState(p.id);
    const col: Col = d.outcome ?? (d.status.startsWith("Partner Assigned") ? "Partner Assigned" : d.status === "Not Contacted" ? "Not Contacted" : "Engaged");
    const due = (ws.data?.outreach ?? []).some((o) => o.deal_id === p.id && isFollowUpDue(o.sent_at, o.replied));
    return { p, d, col, due, partner: PARTNERS.find((x) => x.id === d.assigned_partner_id) };
  }), [ws.data]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-[1500px] px-4 py-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div><h1 className="text-xl font-bold">Co-Sell Pipeline</h1><p className="text-sm text-muted-foreground">{PRESETS.length} opportunities by partner engagement status</p></div>
          {ws.isLoading && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Loading…</span>}
        </div>
        <div className="grid gap-3 overflow-x-auto md:grid-cols-5">
          {COLS.map((c) => {
            const list = cards.filter((x) => x.col === c);
            const total = list.reduce((a, x) => a + x.p.amount, 0);
            return <section key={c} aria-label={c} className="min-w-[220px] rounded-lg border border-border bg-muted/40 p-2">
              <div className="mb-2 flex items-center justify-between px-1"><h2 className="text-sm font-bold">{c} <span className="text-muted-foreground">({list.length})</span></h2><span className="text-xs font-semibold text-muted-foreground">{fmtMoney(total)}</span></div>
              <div className="space-y-2">{list.map(({ p, d, due, partner }) => (
                <article key={p.id} className={`rounded border bg-card p-3 text-sm shadow-[var(--shadow-card)] ${due ? "border-warning" : "border-border"}`}>
                  <p className="text-[11px] text-muted-foreground">{p.id} · {p.country}</p>
                  <p className="font-semibold">{p.account}</p>
                  <p className="text-xs text-muted-foreground">{fmtMoney(p.amount)} · {p.stage}</p>
                  {partner ? <Link to="/partners/$partnerId" params={{ partnerId: partner.id }} className="mt-1 block text-xs font-semibold text-primary hover:underline">{partner.name}</Link>
                    : c === "Engaged" && <p className="mt-1 text-xs text-muted-foreground">{d.status.replace("Partner Engaged: ", "")}</p>}
                  {due && <p className="mt-1 flex items-center gap-1 text-[11px] font-bold"><BellRing className="h-3 w-3 text-warning" />Follow-up due</p>}
                </article>))}
                {!list.length && <p className="px-1 py-4 text-center text-xs text-muted-foreground">No deals</p>}
              </div>
            </section>;
          })}
        </div>
      </main>
    </div>
  );
}
