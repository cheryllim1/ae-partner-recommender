import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, Mail, MapPin, Trophy, XCircle } from "lucide-react";
import { AppHeader } from "@/components/copilot/AppHeader";
import { TierBadge, TypeBadge } from "@/components/copilot/CoPilot";
import { PRESETS } from "@/components/copilot/data";
import { PARTNERS, fmtMoney, isFollowUpDue } from "@/lib/partner-engine";
import { useWorkspace } from "@/hooks/use-workspace";

export const Route = createFileRoute("/partners/$partnerId")({
  loader: ({ params }) => {
    const partner = PARTNERS.find((p) => p.id === params.partnerId);
    if (!partner) throw notFound();
    return { partner };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.partner.name ?? "Partner";
    const desc = loaderData ? `${loaderData.partner.tier} ${loaderData.partner.type} partner in ${loaderData.partner.country}: ${loaderData.partner.winRate}% win rate, deal history and contacts.` : "OpenText partner scorecard.";
    return { meta: [
      { title: `${name} — Partner Scorecard` }, { name: "description", content: desc },
      { property: "og:title", content: `${name} — Partner Scorecard` }, { property: "og:description", content: desc },
      { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary" },
    ] };
  },
  notFoundComponent: () => <div className="p-10 text-center"><p className="font-semibold">Partner not found.</p><Link to="/" className="text-primary underline">Back to workspace</Link></div>,
  component: Scorecard,
});

function Scorecard() {
  const { partner: p } = Route.useLoaderData();
  const ws = useWorkspace();
  const deals = useMemo(() => (ws.data?.deals ?? []).filter((d) => d.assigned_partner_id === p.id).map((d) => ({ d, preset: PRESETS.find((x) => x.id === d.deal_id) })), [ws.data, p.id]);
  const outreach = useMemo(() => (ws.data?.outreach ?? []).filter((o) => o.partner_id === p.id), [ws.data, p.id]);
  const won = deals.filter((x) => x.d.outcome === "Won").length, lost = deals.filter((x) => x.d.outcome === "Lost").length;
  const stat = (v: string | number, l: string) => <div className="rounded border border-border bg-card p-3 text-center"><p className="text-xl font-bold">{v}</p><p className="text-[11px] uppercase text-muted-foreground">{l}</p></div>;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-[1100px] space-y-6 px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="h-4 w-4" />Back to workspace</Link>
        <section className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold">{p.name}</h1><TierBadge tier={p.tier} /><TypeBadge type={p.type} /></div>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{p.country}{p.region ? ` · ${p.region}` : ""}</p>
          <p className="mt-1 text-sm">Focus: {p.productFocus || "—"} · {p.segmentFocus}</p>
          <p className="mt-3 flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /><strong>{p.partnerContact.name}</strong><a href={`mailto:${p.partnerContact.email}`} className="text-primary hover:underline">{p.partnerContact.email}</a></p>
        </section>
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase text-muted-foreground">OpenText track record</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{stat(`${p.winRate}%`, "Win rate")}{stat(`${p.closedWon}/${p.opportunities}`, "Won / Opps")}{stat(fmtMoney(p.avgDealSize), "Avg deal")}{stat(p.certifications, "Certifications")}{stat(`${won}W · ${lost}L`, "Logged by team")}</div>
        </section>
        <section className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <h2 className="mb-2 font-bold">Deals with your team ({deals.length})</h2>
          {!deals.length ? <p className="text-sm text-muted-foreground">Not assigned to any deal yet.</p> :
            <ul className="divide-y divide-border">{deals.map(({ d, preset }) => <li key={d.deal_id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
              <span className="font-semibold">{preset?.account ?? d.deal_id}</span><span className="text-xs text-muted-foreground">{preset ? `${fmtMoney(preset.amount)} · ${preset.stage}` : ""}</span>
              <span className="ml-auto">{d.outcome === "Won" ? <span className="flex items-center gap-1 text-xs font-bold text-success"><Trophy className="h-3.5 w-3.5" />Won</span> : d.outcome === "Lost" ? <span className="flex items-center gap-1 text-xs font-bold text-destructive"><XCircle className="h-3.5 w-3.5" />Lost</span> : <span className="text-xs text-muted-foreground">Open</span>}</span>
              {d.outcome_note && <p className="w-full text-xs text-muted-foreground">“{d.outcome_note}”</p>}
            </li>)}</ul>}
        </section>
        <section className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <h2 className="mb-2 font-bold">Outreach history ({outreach.length})</h2>
          {!outreach.length ? <p className="text-sm text-muted-foreground">No outreach logged yet.</p> :
            <ul className="divide-y divide-border">{outreach.map((o) => <li key={o.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
              <span className="font-semibold">{PRESETS.find((x) => x.id === o.deal_id)?.account ?? o.deal_id}</span>
              <span className="text-xs text-muted-foreground">{o.channel} · {new Date(o.sent_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}</span>
              <span className="ml-auto text-xs font-semibold">{o.replied ? <span className="text-success">Replied</span> : isFollowUpDue(o.sent_at, o.replied) ? "Follow-up due" : "Awaiting reply"}</span>
            </li>)}</ul>}
        </section>
      </main>
    </div>
  );
}
