import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PRESETS } from "@/components/copilot/data";
import { addFriction, loadWorkspace, logActivity, logOutreach, markReplied, saveDeal, setFrictionStatus, type DealState, type Workspace } from "@/lib/team.functions";

const KEY = ["workspace"];

/** Demo-mode starting point: everything works on screen even when the backend can't be reached. */
const EMPTY: Workspace = { me: "AE", deals: [], activities: [], outreach: [], friction: [] };
const tmpId = () => `local-${Math.random().toString(36).slice(2)}`;
const now = () => new Date().toISOString();

/** Saved team workspace: deal statuses, assignments, activity, outreach and blockers. */
export function useWorkspace() {
  const qc = useQueryClient();
  const load = useServerFn(loadWorkspace);
  const q = useQuery({ queryKey: KEY, queryFn: () => load(), staleTime: 30_000, retry: false, initialData: EMPTY });
  const fSave = useServerFn(saveDeal), fAct = useServerFn(logActivity), fOut = useServerFn(logOutreach);
  const fReplied = useServerFn(markReplied), fFr = useServerFn(addFriction), fFrS = useServerFn(setFrictionStatus);
  const patch = (fn: (w: Workspace) => Workspace) => qc.setQueryData<Workspace>(KEY, (w) => (w ? fn(w) : w));
  const fail = (e: unknown) => { console.warn("Demo mode: change not saved", e); };

  const dealState = (id: string): DealState => {
    const saved = q.data?.deals.find((d) => d.deal_id === id);
    const preset = PRESETS.find((p) => p.id === id);
    return saved ?? { deal_id: id, status: preset?.status ?? "Not Contacted", assigned_partner_id: null, outcome: null, outcome_note: null };
  };

  const updateDeal = useMutation({
    mutationFn: (d: DealState) => fSave({ data: d }),
    onMutate: (d) => patch((w) => ({ ...w, deals: [...w.deals.filter((x) => x.deal_id !== d.deal_id), d] })),
    onError: fail,
  });
  const activity = useMutation({
    mutationFn: (a: { deal_id: string; type: string; partner_name: string; description: string }) => fAct({ data: a }),
    onMutate: (a) => {
      const id = tmpId();
      patch((w) => ({ ...w, activities: [{ id, deal_id: a.deal_id, type: a.type, partner_name: a.partner_name, description: a.description, user_name: null, created_at: now() }, ...w.activities] }));
      return { id };
    },
    onSuccess: (row, _a, ctx) => patch((w) => ({ ...w, activities: w.activities.map((x) => (x.id === ctx?.id ? row : x)) })),
    onError: fail,
  });
  const outreach = useMutation({
    mutationFn: (o: { deal_id: string; partner_id: string; partner_name: string; channel: "Email" | "Slack" }) => fOut({ data: o }),
    onMutate: (o) => {
      const id = tmpId();
      patch((w) => ({ ...w, outreach: [{ id, deal_id: o.deal_id, partner_id: o.partner_id, partner_name: o.partner_name, channel: o.channel, replied: false, sent_at: now() }, ...w.outreach] }));
      return { id };
    },
    onSuccess: (row, _o, ctx) => patch((w) => ({ ...w, outreach: w.outreach.map((x) => (x.id === ctx?.id ? row : x)) })),
    onError: fail,
  });
  const replied = useMutation({
    mutationFn: (id: string) => fReplied({ data: { id } }),
    onMutate: (id) => patch((w) => ({ ...w, outreach: w.outreach.map((o) => (o.id === id ? { ...o, replied: true } : o)) })),
    onError: fail,
  });
  const friction = useMutation({
    mutationFn: (f: { deal: string; category: string; notes: string }) => fFr({ data: f }),
    onMutate: (f) => {
      const id = tmpId();
      patch((w) => ({ ...w, friction: [{ id, deal: f.deal, category: f.category, notes: f.notes, status: "New", created_at: now() }, ...w.friction] }));
      return { id };
    },
    onSuccess: (row, _f, ctx) => patch((w) => ({ ...w, friction: w.friction.map((x) => (x.id === ctx?.id ? row : x)) })),
    onError: fail,
  });
  const frictionStatus = useMutation({
    mutationFn: (f: { id: string; status: "New" | "In Progress" | "Resolved" }) => fFrS({ data: f }),
    onMutate: (f) => patch((w) => ({ ...w, friction: w.friction.map((x) => (x.id === f.id ? { ...x, status: f.status } : x)) })),
    onError: fail,
  });

  return { ...q, dealState, updateDeal: updateDeal.mutate, logActivity: activity.mutate, logOutreach: outreach.mutate, markReplied: replied.mutate, addFriction: friction.mutate, setFrictionStatus: frictionStatus.mutate };
}
