import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { PRESETS } from "@/components/copilot/data";
import { addFriction, loadWorkspace, logActivity, logOutreach, markReplied, saveDeal, setFrictionStatus, type DealState, type Workspace } from "@/lib/team.functions";

const KEY = ["workspace"];

/** Saved team workspace: deal statuses, assignments, outcomes, activity, outreach and blockers. */
export function useWorkspace() {
  const qc = useQueryClient();
  const load = useServerFn(loadWorkspace);
  const q = useQuery({ queryKey: KEY, queryFn: () => load(), staleTime: 30_000, retry: 1 });
  const fSave = useServerFn(saveDeal), fAct = useServerFn(logActivity), fOut = useServerFn(logOutreach);
  const fReplied = useServerFn(markReplied), fFr = useServerFn(addFriction), fFrS = useServerFn(setFrictionStatus);
  const patch = (fn: (w: Workspace) => Workspace) => qc.setQueryData<Workspace>(KEY, (w) => (w ? fn(w) : w));
  const fail = (e: unknown) => { console.error(e); toast.error("Couldn't save that change — please try again."); qc.invalidateQueries({ queryKey: KEY }); };

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
    onSuccess: (row) => patch((w) => ({ ...w, activities: [row, ...w.activities] })),
    onError: fail,
  });
  const outreach = useMutation({
    mutationFn: (o: { deal_id: string; partner_id: string; partner_name: string; channel: "Email" | "Slack" }) => fOut({ data: o }),
    onSuccess: (row) => patch((w) => ({ ...w, outreach: [row, ...w.outreach] })),
    onError: fail,
  });
  const replied = useMutation({
    mutationFn: (id: string) => fReplied({ data: { id } }),
    onMutate: (id) => patch((w) => ({ ...w, outreach: w.outreach.map((o) => (o.id === id ? { ...o, replied: true } : o)) })),
    onError: fail,
  });
  const friction = useMutation({
    mutationFn: (f: { deal: string; category: string; notes: string }) => fFr({ data: f }),
    onSuccess: (row) => patch((w) => ({ ...w, friction: [row, ...w.friction] })),
    onError: fail,
  });
  const frictionStatus = useMutation({
    mutationFn: (f: { id: string; status: "New" | "In Progress" | "Resolved" }) => fFrS({ data: f }),
    onMutate: (f) => patch((w) => ({ ...w, friction: w.friction.map((x) => (x.id === f.id ? { ...x, status: f.status } : x)) })),
    onError: fail,
  });

  return { ...q, dealState, updateDeal: updateDeal.mutate, logActivity: activity.mutate, logOutreach: outreach.mutate, markReplied: replied.mutate, addFriction: friction.mutate, setFrictionStatus: frictionStatus.mutate };
}
