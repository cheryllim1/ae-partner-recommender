import { createClient } from "@supabase/supabase-js";
import { getRequest } from "@tanstack/react-start/server";
import type { Database } from "@/integrations/supabase/types";
import { getSessionUser } from "./auth.server";

/** Supabase client acting as the signed-in Lovable user (RLS applies). Throws when anonymous. */
export async function teamDb() {
  const user = await getSessionUser();
  const token = getRequest()?.headers.get("x-lovable-identity-token");
  if (!user || !token) throw new Error("Unauthorized");
  const db = createClient<Database>(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    accessToken: async () => token,
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { db, user };
}
