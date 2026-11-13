import { useState } from "react";
import { BellRing, Trophy, XCircle, Check } from "lucide-react";
import { isFollowUpDue, FOLLOW_UP_DAYS } from "@/lib/partner-engine";
import type { OutreachRow } from "@/lib/team.functions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const ago = (iso: string) => { const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000); return d <= 0 ? "today" : d === 1 ? "1 day ago" : `${d} days ago`; };

export function FollowUps({ items, onReplied }: { items: OutreachRow[]; onReplied: (id: string) => void }) {
  if (!items.length) return null;
  return (
    <section aria-label="Partner follow-ups" className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><BellRing className="h-4 w-4 text-warning" />Outreach & Follow-ups</p>
      <ul className="space-y-2">{items.map((o) => {
        const due = isFollowUpDue(o.sent_at, o.replied);
        return <li key={o.id} className={`flex flex-wrap items-center gap-2 rounded border px-3 py-2 text-sm ${due ? "border-warning bg-warning/10" : "border-border"}`}>
          <span className="font-semibold">{o.partner_name}</span><span className="text-xs text-muted-foreground">{o.channel} · {ago(o.sent_at)}</span>
          {o.replied ? <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-success"><Check className="h-3.5 w-3.5" />Replied</span>
            : <>{due && <span className="rounded-full bg-warning px-2 py-0.5 text-[11px] font-bold text-foreground">Follow up — no reply in {FOLLOW_UP_DAYS}+ days</span>}
              <button onClick={() => onReplied(o.id)} className="ml-auto rounded border border-border px-2 py-1 text-xs font-semibold hover:bg-muted">Mark replied</button></>}
        </li>; })}</ul>
    </section>
  );
}

export function DealOutcome({ outcome, note, partnerName, onSave }: { outcome: "Won" | "Lost" | null; note: string | null; partnerName?: string | undefined; onSave: (o: "Won" | "Lost" | null, note: string) => void }) {
  const [n, setN] = useState(note ?? "");
  const [reminderOpen, setReminderOpen] = useState(false);
  return (
    <section aria-label="Deal outcome" className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Trophy className="h-4 w-4 text-success" />Deal Outcome</p>
      {!partnerName ? <>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="border-success hover:bg-success/10" onClick={() => setReminderOpen(true)}><Trophy className="text-success" />Won</Button>
          <Button variant="outline" className="border-destructive hover:bg-destructive/10" onClick={() => setReminderOpen(true)}><XCircle className="text-destructive" />Lost</Button>
        </div>
        <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
          <DialogContent className="w-[calc(100%-2rem)] rounded-lg">
            <DialogTitle className="pr-6">Assign a partner first</DialogTitle>
            <DialogDescription>Assign a partner first to log a win or loss.</DialogDescription>
          </DialogContent>
        </Dialog>
      </> : <>
        <p className="text-xs text-muted-foreground">Logging the result with <strong>{partnerName}</strong> improves future partner rankings.</p>
        <input aria-label="Outcome note" placeholder="Optional note (e.g. why it was won or lost)" value={n} onChange={(e) => setN(e.target.value)} className="mt-2 h-9 w-full rounded border border-input bg-card px-2 text-sm" />
        <div className="mt-2 flex flex-wrap gap-2">
          <button onClick={() => onSave("Won", n)} className={`flex h-9 items-center gap-1.5 rounded px-3 text-sm font-semibold ${outcome === "Won" ? "bg-success text-success-foreground" : "border border-success hover:bg-success/10"}`}><Trophy className="h-4 w-4" />Won</button>
          <button onClick={() => onSave("Lost", n)} className={`flex h-9 items-center gap-1.5 rounded px-3 text-sm font-semibold ${outcome === "Lost" ? "bg-destructive text-destructive-foreground" : "border border-destructive hover:bg-destructive/10"}`}><XCircle className="h-4 w-4" />Lost</button>
          {outcome && <button onClick={() => onSave(null, "")} className="h-9 rounded border border-border px-3 text-sm font-semibold hover:bg-muted">Reset</button>}
        </div></>}
    </section>
  );
}
