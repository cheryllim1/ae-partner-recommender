import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type DealState = { deal_id: string; status: string; assigned_partner_id: string | null; outcome: "Won" | "Lost" | null; outcome_note: string | null };
export type ActivityRow = { id: string; deal_id: string; type: string; partner_name: string; description: string; user_name: string | null; created_at: string };
export type OutreachRow = { id: string; deal_id: string; partner_id: string; partner_name: string; channel: string; replied: boolean; sent_at: string };
export type FrictionRow = { id: string; deal: string; category: string; notes: string; status: "New" | "In Progress" | "Resolved"; created_at: string };
export type Workspace = { me: string; deals: DealState[]; activities: ActivityRow[]; outreach: OutreachRow[]; friction: FrictionRow[] };

export const loadWorkspace = createServerFn({ method: "GET" }).handler(async (): Promise<Workspace> => {
  const { teamDb } = await import("./team.server");
  const { db, user } = await teamDb();
  const [d, a, o, f] = await Promise.all([
    db.from("deal_state").select("deal_id,status,assigned_partner_id,outcome,outcome_note"),
    db.from("activities").select("*").order("created_at", { ascending: false }).limit(200),
    db.from("outreach").select("*").order("sent_at", { ascending: false }).limit(500),
    db.from("friction_items").select("*").order("created_at", { ascending: false }),
  ]);
  const err = d.error ?? a.error ?? o.error ?? f.error;
  if (err) { console.error(err); throw new Error("Could not load saved workspace"); }
  return { me: user.displayName ?? user.email ?? "AE", deals: d.data as DealState[], activities: a.data as ActivityRow[], outreach: o.data as OutreachRow[], friction: f.data as FrictionRow[] };
});

export const saveDeal = createServerFn({ method: "POST" })
  .validator((v) => z.object({
    deal_id: z.string().min(1).max(50), status: z.string().max(200),
    assigned_partner_id: z.string().max(100).nullable(), outcome: z.enum(["Won", "Lost"]).nullable(), outcome_note: z.string().max(1000).nullable(),
  }).parse(v))
  .handler(async ({ data }) => {
    const { teamDb } = await import("./team.server");
    const { db, user } = await teamDb();
    const { error } = await db.from("deal_state").upsert({ ...data, updated_by: user.userId, updated_at: new Date().toISOString() });
    if (error) { console.error(error); throw new Error("Could not save deal"); }
    return { ok: true };
  });

export const logActivity = createServerFn({ method: "POST" })
  .validator((v) => z.object({ deal_id: z.string().max(50), type: z.string().max(100), partner_name: z.string().max(200), description: z.string().max(1000) }).parse(v))
  .handler(async ({ data }) => {
    const { teamDb } = await import("./team.server");
    const { db, user } = await teamDb();
    const { data: row, error } = await db.from("activities").insert({ ...data, user_name: user.displayName ?? user.email ?? null }).select().single();
    if (error) { console.error(error); throw new Error("Could not log activity"); }
    return row as ActivityRow;
  });

export const logOutreach = createServerFn({ method: "POST" })
  .validator((v) => z.object({ deal_id: z.string().max(50), partner_id: z.string().max(100), partner_name: z.string().max(200), channel: z.enum(["Email", "Slack"]) }).parse(v))
  .handler(async ({ data }) => {
    const { teamDb } = await import("./team.server");
    const { db } = await teamDb();
    const { data: row, error } = await db.from("outreach").insert(data).select().single();
    if (error) { console.error(error); throw new Error("Could not log outreach"); }
    return row as OutreachRow;
  });

export const markReplied = createServerFn({ method: "POST" })
  .validator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data }) => {
    const { teamDb } = await import("./team.server");
    const { db } = await teamDb();
    const { error } = await db.from("outreach").update({ replied: true }).eq("id", data.id);
    if (error) { console.error(error); throw new Error("Could not update"); }
    return { ok: true };
  });

export const addFriction = createServerFn({ method: "POST" })
  .validator((v) => z.object({ deal: z.string().max(300), category: z.string().max(100), notes: z.string().max(2000) }).parse(v))
  .handler(async ({ data }) => {
    const { teamDb } = await import("./team.server");
    const { db } = await teamDb();
    const { data: row, error } = await db.from("friction_items").insert(data).select().single();
    if (error) { console.error(error); throw new Error("Could not save blocker"); }
    return row as FrictionRow;
  });

export const setFrictionStatus = createServerFn({ method: "POST" })
  .validator((v) => z.object({ id: z.string().uuid(), status: z.enum(["New", "In Progress", "Resolved"]) }).parse(v))
  .handler(async ({ data }) => {
    const { teamDb } = await import("./team.server");
    const { db } = await teamDb();
    const { error } = await db.from("friction_items").update({ status: data.status }).eq("id", data.id);
    if (error) { console.error(error); throw new Error("Could not update blocker"); }
    return { ok: true };
  });
