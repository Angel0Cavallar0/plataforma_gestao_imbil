import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type MarketingClient = SupabaseClient<Database, "marketing">;

export function marketingSchema(client: SupabaseClient<Database>) {
  return client.schema("marketing");
}
