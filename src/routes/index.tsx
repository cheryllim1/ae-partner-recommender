import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Cloud, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { OpportunityPanel } from "@/components/copilot/OpportunityPanel";
import { CoPilot } from "@/components/copilot/CoPilot";
import { SummaryDrawer, type LiveActivity } from "@/components/copilot/SummaryDrawer";
import { AppHeader } from "@/components/copilot/AppHeader";
import { DealOutcome, FollowUps } from "@/components/copilot/DealExtras";
import { PRESETS, type EngagementStatus, type FrictionItem } from "@/components/copilot/data";
import { PARTNERS, outcomeBoosts, type Opportunity, type Partner, type Scored } from "@/lib/partner-engine";
import { useWorkspace } from "@/hooks/use-workspace";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AE Partner Co-Pilot — OpenText Opportunity Workspace" },
      { name: "description", content: "Top 3 best-fit OpenText channel partners for every active deal, with win-rate proof and 1-click outreach." },
      { property: "og:title", content: "AE Partner Co-Pilot — OpenText Opportunity Workspace" },
      { property: "og:description", content: "Rank certified OpenText partners by match score and dispatch outreach in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const ws = useWorkspace();
  const [presetId, setPresetId] = useState(PRESETS[0]!.id);
  const [edits, setEdits] = useState<Record<string, Opportunity>>({});
  const preset = PRESETS.find((p) => p.id === presetId)!;
  const opp = edits[presetId] ?? preset;
  const deal = ws.dealState(presetId);
  const status = deal.status as EngagementStatus;
  const assignedPartner = PARTNERS.find((p) => p.id === deal.assigned_partner_id);
  const data = ws.data;

  const boosts = useMemo(() => outcomeBoosts((data?.deals ?? []).filter((d) => d.outcome && d.assigned_partner_id).map((d) => ({ partnerId: d.assigned_partner_id!, outcome: d.outcome! }))), [data?.deals]);
  const dispatches = useMemo(() => (data?.deals ?? []).filter((d) => d.status.includes("Slack")).length, [data?.deals]);
  const activities: LiveActivity[] = useMemo(() => (data?.activities ?? []).map((a) => ({ activityId: a.id, timestamp: a.created_at, type: a.type, partnerName: a.partner_name, description: a.user_name ? `${a.description} — ${a.user_name}` : a.description, status: "Success" })), [data?.activities]);
  const friction: FrictionItem[] = useMemo(() => (data?.friction ?? []).map((f) => ({ id: f.id, deal: f.deal, category: f.category, notes: f.notes, status: f.status, date: f.created_at.slice(0, 10) })), [data?.friction]);
  const dealOutreach = useMemo(() => (data?.outreach ?? []).filter((o) => o.deal_id === presetId), [data?.outreach, presetId]);

  const setDeal = (patch: Partial<typeof deal>) => ws.updateDeal({ ...deal, ...patch });
  const act = (type: string, partnerName: string, description: string) => ws.logActivity({ deal_id: presetId, type, partner_name: partnerName, description });

  const onEmail = (s: Scored) => {
    if (!status.startsWith("Partner Assigned") && !status.includes("Slack")) setDeal({ status: "Partner Engaged: Email Sent" });
    ws.logOutreach({ deal_id: presetId, partner_id: s.partner.id, partner_name: s.partner.name, channel: "Email" });
    act("Email Template Sent", s.partner.name, `Intro email copied for ${opp.account} (${opp.stage}).`);
  };
  const onSlack = (s: Scored) => {
    if (!status.startsWith("Partner Assigned")) setDeal({ status: "Partner Engaged: Dispatched to Slack (Pending Reply)" });
    ws.logOutreach({ deal_id: presetId, partner_id: s.partner.id, partner_name: s.partner.name, channel: "Slack" });
    act("Co-Sell Registration", s.partner.name, `Pinged ${s.partner.name} on Slack for ${opp.account}; partner manager notified.`);
  };
  const assign = (p: Partner) => {
    setDeal({ assigned_partner_id: p.id, status: `Partner Assigned: ${p.name}`, outcome: null, outcome_note: null });
    act("Partner Assigned", p.name, `${p.name} assigned as primary co-sell partner for ${opp.account}.`);
    toast.success(`${p.name} assigned to ${opp.account}`);
  };
  const clear = () => {
    if (!assignedPartner) return;
    setDeal({ assigned_partner_id: null, status: "Not Contacted", outcome: null, outcome_note: null });
    act("Partner Cleared", assignedPartner.name, `Partner assignment cleared for ${opp.account}.`);
  };
  const saveOutcome = (o: "Won" | "Lost" | null, note: string) => {
    if (!assignedPartner) return;
    setDeal({ outcome: o, outcome_note: note || null });
    if (o) { act(`Deal ${o}`, assignedPartner.name, `${opp.account} marked ${o} with ${assignedPartner.name}${note ? `: ${note}` : "."}`); toast.success(`${opp.account} logged as ${o}`); }
  };
  const focusCoPilot = () => document.getElementById("copilot")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-[1500px] px-4 py-6">
        <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground"><Cloud className="h-4 w-4 text-sky" />Opportunities › {opp.account}
          {ws.isLoading && <span className="ml-2 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Loading saved work…</span>}
          {ws.isError && <span className="ml-2 font-semibold text-destructive">Saved work couldn't load — changes won't be saved.</span>}
        </div>
        <div className="grid gap-6 lg:grid-cols-[45fr_55fr]">
          <div className="space-y-4">
            <OpportunityPanel presetId={presetId} presets={PRESETS} onPreset={setPresetId} opp={opp}
              onChange={(o) => setEdits((e) => ({ ...e, [presetId]: o }))} status={status}
              partner={assignedPartner} onChangePartner={focusCoPilot} onClearPartner={clear} />
            <FollowUps items={dealOutreach} onReplied={ws.markReplied} />
            <DealOutcome key={`${presetId}-${deal.outcome}`} outcome={deal.outcome} note={deal.outcome_note} partnerName={assignedPartner?.name} onSave={saveOutcome} />
          </div>
          <div id="copilot"><CoPilot opp={opp} boosts={boosts} assignedId={deal.assigned_partner_id ?? undefined} onAssign={assign} onEmail={onEmail} onSlack={onSlack} /></div>
        </div>
        <SummaryDrawer dispatches={dispatches} activities={activities} friction={friction}
          onAddFriction={ws.addFriction} onFrictionStatus={(id, s) => ws.setFrictionStatus({ id, status: s })}
          dealOptions={PRESETS.map((p) => `${p.id} | ${p.account}`)} />
      </main>
    </div>
  );
}
