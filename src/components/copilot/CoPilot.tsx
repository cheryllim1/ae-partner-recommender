import { Fragment, useMemo, useState } from "react";
import type React from "react";
import { Sparkles, PenLine, Check, CheckCircle2, UserCheck, Copy, Loader2, Mail, MapPin, Search, Zap, Award, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { draftIntroEmail } from "@/lib/ai-email.functions";
import { type Partner, PARTNERS, STAGE_LOGIC, buildIntroEmail, fmtMoney, rankWithHistory, scorePartner, type Opportunity, type Scored } from "@/lib/partner-engine";

const tierCls: Record<string, string> = {
  Platinum: "bg-navy text-navy-foreground", Gold: "bg-warning/20 text-foreground border border-warning/50",
  Silver: "bg-muted text-foreground border border-border", Authorized: "bg-accent text-accent-foreground",
};
export const TierBadge = ({ tier }: { tier: string }) => <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${tierCls[tier] ?? tierCls["Authorized"]}`}>{tier}</span>;
export const TypeBadge = ({ type }: { type: string }) => <span className="rounded border border-sky/40 px-2 py-0.5 text-[11px] font-semibold text-sky">{type}</span>;

function ConfirmAssign({ p, opp, onConfirm, onCancel }: { p: Partner; opp: Opportunity; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div role="dialog" aria-label="Confirm partner" className="mt-3 rounded-lg border border-success bg-success/5 p-3 text-left">
      <p className="text-sm">Assign <strong>{p.name}</strong> as primary co-sell partner for <strong>{opp.account}</strong> ({fmtMoney(opp.amount)})?</p>
      <div className="mt-2 flex gap-2">
        <button onClick={onConfirm} className="h-9 rounded bg-success px-3 text-sm font-semibold text-success-foreground">Confirm</button>
        <button onClick={onCancel} className="h-9 rounded border border-border bg-card px-3 text-sm font-semibold">Cancel</button>
      </div>
    </div>
  );
}

function EmailComposer({ s, opp, onCopied, onClose }: { s: Scored; opp: Opportunity; onCopied: () => void; onClose: () => void }) {
  const p = s.partner;
  const [text, setText] = useState(() => buildIntroEmail(s, opp));
  const [tone, setTone] = useState<"Concise" | "Warm" | "Formal">("Concise");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const draft = useServerFn(draftIntroEmail);
  const generate = async () => {
    setBusy(true);
    try {
      const r = await draft({ data: { partnerName: p.name, contactName: p.partnerContact.name, tier: p.tier, type: p.type, winRate: p.winRate, closedWon: p.closedWon, certifications: p.certifications, country: p.country,
        account: opp.account, dealCountry: opp.country, product: opp.product, amount: opp.amount, stage: opp.stage, motion: STAGE_LOGIC[opp.stage].motion, tone } });
      if (r.text) { setText(r.text); toast.success("AI draft ready — review and edit before sending"); } else toast.error(r.error ?? "Couldn't write a draft");
    } catch { toast.error("Couldn't write a draft — please try again."); } finally { setBusy(false); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch { /* clipboard blocked */ }
    setCopied(true); onCopied(); toast.success(`Intro email for ${p.partnerContact.name} copied`); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="mt-3 rounded-lg border border-primary/40 bg-accent/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Tone" value={tone} onChange={(e) => setTone(e.target.value as typeof tone)} className="h-9 rounded border border-input bg-card px-2 text-sm">
          {["Concise", "Warm", "Formal"].map((t) => <option key={t}>{t}</option>)}</select>
        <button onClick={generate} disabled={busy} className="flex h-9 items-center gap-1.5 rounded bg-navy px-3 text-sm font-semibold text-navy-foreground disabled:opacity-70">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{busy ? "Writing…" : "Write with AI"}</button>
        <button onClick={onClose} className="ml-auto text-xs font-semibold text-muted-foreground hover:text-foreground">Close</button>
      </div>
      <textarea aria-label="Intro email" value={text} onChange={(e) => setText(e.target.value)} rows={10} className="mt-2 w-full rounded border border-input bg-card p-2 text-sm leading-relaxed" />
      <button onClick={copy} className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded border border-primary bg-card text-sm font-semibold text-primary hover:bg-accent">
        {copied ? <><Check className="h-4 w-4" />Copied!</> : <><Copy className="h-4 w-4" />Copy Email & Log Outreach</>}</button>
    </div>
  );
}

function PartnerCard({ s, rank, opp, onEmail, onSlack, assigned, onSelect, confirm }: { s: Scored; rank: number; opp: Opportunity; onEmail: () => void; onSlack: () => void; assigned: boolean; onSelect: () => void; confirm?: React.ReactNode }) {
  const [composing, setComposing] = useState(false);
  const [sending, setSending] = useState(false);
  const p = s.partner;
  const ping = () => {
    setSending(true);
    setTimeout(() => { setSending(false); onSlack(); toast.success("Dispatched to #pde-deal-reg & Partner Manager notified"); }, 400);
  };
  return (
    <article className={`rounded-lg border bg-card p-4 shadow-[var(--shadow-card)] ${assigned ? "border-success ring-2 ring-success/40" : rank === 1 ? "border-primary ring-1 ring-primary/30" : "border-border"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${rank === 1 ? "bg-primary text-primary-foreground" : "bg-navy text-navy-foreground"}`}>#{rank} {rank === 1 ? "Best Match" : "Match"} — {s.score}% Score</span>
        {assigned && <span className="flex items-center gap-1 rounded-full bg-success px-2.5 py-0.5 text-xs font-bold text-success-foreground"><CheckCircle2 className="h-3.5 w-3.5" />Assigned Co-Sell Partner</span>}
        {s.matchKind !== "exact" && <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-foreground border border-warning/40">Regional / EMEA Fallback Match</span>}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Link to="/partners/$partnerId" params={{ partnerId: p.id }} className="text-base font-bold hover:underline">{p.name}</Link><TierBadge tier={p.tier} /><TypeBadge type={p.type} />
      </div>
      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{p.country}{p.region ? ` · ${p.region}` : ""}</p>
      <p className="mt-2 flex items-start gap-1.5 rounded bg-success/10 px-2 py-1.5 text-xs font-medium text-foreground"><Award className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />{s.why}</p>
      <div className="mt-3 grid grid-cols-3 divide-x divide-border rounded border border-border text-center">
        <div className="py-2"><p className="text-lg font-bold text-primary">{p.winRate}%</p><p className="text-[10px] uppercase text-muted-foreground">Win Rate</p></div>
        <div className="py-2"><p className="text-lg font-bold">{p.closedWon}/{p.opportunities}</p><p className="text-[10px] uppercase text-muted-foreground">Won / Opps</p></div>
        <div className="py-2"><p className="text-lg font-bold">{fmtMoney(p.avgDealSize)}</p><p className="text-[10px] uppercase text-muted-foreground">Avg Deal</p></div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        <Mail className="h-3.5 w-3.5 text-muted-foreground" /><span className="font-semibold">{p.partnerContact.name}</span>
        <span className="truncate text-muted-foreground">· {p.partnerContact.email}</span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button onClick={() => setComposing(!composing)} className="flex h-11 items-center justify-center gap-2 rounded border border-primary text-sm font-semibold text-primary hover:bg-accent">
          <PenLine className="h-4 w-4" />{composing ? "Hide Email" : "Write Intro Email"}</button>
        <button onClick={ping} disabled={sending} className="flex h-11 items-center justify-center gap-2 rounded bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-80">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}{sending ? "Dispatching…" : "Ping PDE on Slack"}</button>
        <button onClick={onSelect} disabled={assigned} className="flex h-11 items-center justify-center gap-2 rounded border border-success bg-success/10 text-sm font-semibold text-foreground hover:bg-success/20 disabled:opacity-70 sm:col-span-2">
          <UserCheck className="h-4 w-4 text-success" />{assigned ? "Assigned to this deal" : "Select & Confirm Partner"}</button>
      </div>
      {composing && <EmailComposer s={s} opp={opp} onCopied={onEmail} onClose={() => setComposing(false)} />}
      {confirm}
    </article>
  );
}

function Directory({ opp, assignedId, onSelect, renderConfirm }: { opp: Opportunity; assignedId?: string | undefined; onSelect: (p: Partner) => void; renderConfirm: (p: Partner) => React.ReactNode }) {
  const [q, setQ] = useState(""); const [country, setCountry] = useState(""); const [tier, setTier] = useState(""); const [type, setType] = useState(""); const [page, setPage] = useState(0);
  const countries = useMemo(() => Array.from(new Set(PARTNERS.map((p) => p.country))).sort(), []);
  const types = useMemo(() => Array.from(new Set(PARTNERS.map((p) => p.type))).sort(), []);
  const rows = useMemo(() => PARTNERS.filter((p) => (!q || p.name.toLowerCase().includes(q.toLowerCase())) && (!country || p.country === country) && (!tier || p.tier === tier) && (!type || p.type === type)), [q, country, tier, type]);
  const pages = Math.max(1, Math.ceil(rows.length / 20));
  const cur = Math.min(page, pages - 1);
  const sel = "h-9 rounded border border-input bg-card px-2 text-sm";
  const upd = (f: (v: string) => void) => (e: { target: { value: string } }) => { f(e.target.value); setPage(0); };
  return (
    <div className="rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="grid grid-cols-2 gap-2 border-b border-border p-3 md:grid-cols-4">
        <div className="relative col-span-2 md:col-span-1"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input placeholder="Search name…" value={q} onChange={upd(setQ)} className={`${sel} w-full pl-8`} /></div>
        <select aria-label="Country" className={sel} value={country} onChange={upd(setCountry)}><option value="">All countries</option>{countries.map((c) => <option key={c}>{c}</option>)}</select>
        <select aria-label="Tier" className={sel} value={tier} onChange={upd(setTier)}><option value="">All tiers</option>{["Platinum", "Gold", "Silver", "Authorized"].map((c) => <option key={c}>{c}</option>)}</select>
        <select aria-label="Program" className={sel} value={type} onChange={upd(setType)}><option value="">All programs</option>{types.map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr>
            <th className="px-3 py-2">Partner</th><th className="px-3 py-2">Country</th><th className="px-3 py-2">Tier / Program</th><th className="px-3 py-2 text-right">Win Rate</th><th className="px-3 py-2 text-right">Fit</th><th className="px-3 py-2" /></tr></thead>
          <tbody>{rows.slice(cur * 20, cur * 20 + 20).map((p) => { const c = renderConfirm(p); return (
            <Fragment key={p.id}><tr className="border-t border-border hover:bg-accent/50">
              <td className="px-3 py-2"><Link to="/partners/$partnerId" params={{ partnerId: p.id }} className="font-semibold hover:underline">{p.name}</Link><p className="text-xs text-muted-foreground">{p.partnerContact.name} · {p.certifications} certs</p></td>
              <td className="px-3 py-2 text-xs">{p.country}</td>
              <td className="px-3 py-2"><div className="flex flex-wrap gap-1"><TierBadge tier={p.tier} /><TypeBadge type={p.type} /></div></td>
              <td className="px-3 py-2 text-right font-semibold">{p.winRate}%</td>
              <td className="px-3 py-2 text-right text-xs font-semibold text-primary">{scorePartner(p, opp).score}%</td>
              <td className="px-3 py-2 text-right">{assignedId === p.id
                ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-success"><CheckCircle2 className="h-3.5 w-3.5" />Assigned</span>
                : <button onClick={() => onSelect(p)} className="whitespace-nowrap rounded border border-success px-2 py-1 text-xs font-semibold hover:bg-success/10">Assign to Deal</button>}</td>
            </tr>{c && <tr><td colSpan={6} className="px-3 pb-3">{c}</td></tr>}</Fragment>); })}
            {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No partners match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-border p-3 text-xs text-muted-foreground">
        <span>{rows.length} partners · page {cur + 1} of {pages}</span>
        <div className="flex gap-1">
          <button aria-label="Previous page" disabled={cur === 0} onClick={() => setPage(cur - 1)} className="rounded border border-border p-1 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
          <button aria-label="Next page" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} className="rounded border border-border p-1 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

export function CoPilot({ opp, onEmail, onSlack, assignedId, onAssign, boosts }: { boosts: Record<string, number>; opp: Opportunity; onEmail: (s: Scored) => void; onSlack: (s: Scored) => void; assignedId?: string | undefined; onAssign: (p: Partner) => void }) {
  const [view, setView] = useState<"top" | "all">("top");
  const [pending, setPending] = useState<Partner | null>(null);
  const top = useMemo(() => rankWithHistory(opp, boosts), [opp, boosts]);
  const renderConfirm = (p: Partner) => pending?.id === p.id ? <ConfirmAssign p={p} opp={opp} onConfirm={() => { onAssign(p); setPending(null); }} onCancel={() => setPending(null)} /> : null;
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-sky"><Zap className="h-3.5 w-3.5" />AE Partner Co-Pilot</p>
          <h2 className="text-lg font-bold">{view === "top" ? "Top 3 Recommended Partners" : `Partner Directory (${PARTNERS.length})`}</h2>
        </div>
        <button onClick={() => setView(view === "top" ? "all" : "top")} className="h-9 rounded border border-border bg-card px-3 text-sm font-semibold text-primary hover:bg-accent">
          {view === "top" ? `Browse All ${PARTNERS.length} Partners` : "Back to Top 3"}</button>
      </div>
      {view === "top" ? (
        <div className="space-y-3">{top.map((s, i) => <PartnerCard key={s.partner.id} s={s} rank={i + 1} opp={opp} onEmail={() => onEmail(s)} onSlack={() => onSlack(s)} assigned={assignedId === s.partner.id} onSelect={() => setPending(s.partner)} confirm={renderConfirm(s.partner)} />)}</div>
      ) : <Directory opp={opp} assignedId={assignedId} onSelect={setPending} renderConfirm={renderConfirm} />}
    </div>
  );
}
