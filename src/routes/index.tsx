import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Cloud, CheckCircle2 } from "lucide-react";
import { OpportunityPanel } from "@/components/copilot/OpportunityPanel";
import { CoPilot } from "@/components/copilot/CoPilot";
import { SummaryDrawer, type LiveActivity } from "@/components/copilot/SummaryDrawer";
import { PRESETS, SEED_FRICTION, type EngagementStatus } from "@/components/copilot/data";
import type { Opportunity, Scored } from "@/lib/partner-engine";

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
  const [presetId, setPresetId] = useState(PRESETS[0]!.id);
  const [edits, setEdits] = useState<Record<string, Opportunity>>({});
  const [statuses, setStatuses] = useState<Record<string, EngagementStatus>>(() => Object.fromEntries(PRESETS.map((p) => [p.id, p.status])));
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  const [friction, setFriction] = useState(SEED_FRICTION);
  const preset = PRESETS.find((p) => p.id === presetId)!;
  const opp = edits[presetId] ?? preset;
  const status = statuses[presetId] ?? preset.status;
  const dispatches = useMemo(() => Object.values(statuses).filter((s) => s.includes("Slack")).length, [statuses]);

  const log = (s: Scored, type: string, description: string, next: EngagementStatus) => {
    setStatuses((st) => ({ ...st, [presetId]: st[presetId] === "Partner Engaged: Dispatched to Slack (Pending Reply)" && next.includes("Email") ? st[presetId] : next }));
    setActivities((a) => [{ activityId: `LIVE-${Date.now()}`, timestamp: new Date().toISOString(), type, partnerName: s.partner.name, description, status: "Success" }, ...a]);
  };

  return (
    <div className="min-h-screen">
      <header className="bg-navy text-navy-foreground">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary font-bold">OT</div>
            <div><p className="text-sm font-bold leading-tight">OpenText · Sales Cloud</p><p className="text-[11px] opacity-70">Opportunity Workspace</p></div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-success px-3 py-1 text-xs font-semibold text-success-foreground"><CheckCircle2 className="h-3.5 w-3.5" />Synced with Salesforce</span>
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] px-4 py-6">
        <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground"><Cloud className="h-4 w-4 text-sky" />Opportunities › {opp.account}</div>
        <div className="grid gap-6 lg:grid-cols-[45fr_55fr]">
          <OpportunityPanel presetId={presetId} presets={PRESETS} onPreset={setPresetId} opp={opp}
            onChange={(o) => setEdits((e) => ({ ...e, [presetId]: o }))} status={status} />
          <CoPilot opp={opp}
            onEmail={(s) => log(s, "Email Template Sent", `Intro email copied for ${opp.account} (${opp.stage}).`, "Partner Engaged: Email Sent")}
            onSlack={(s) => log(s, "Co-Sell Registration", `Dispatched to #pde-deal-reg for ${opp.account}; partner manager notified.`, "Partner Engaged: Dispatched to Slack (Pending Reply)")} />
        </div>
        <SummaryDrawer dispatches={dispatches} activities={activities} friction={friction} setFriction={setFriction}
          dealOptions={PRESETS.map((p) => `${p.id} | ${p.account}`)} />
      </main>
    </div>
  );
}
