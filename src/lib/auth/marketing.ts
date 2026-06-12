import { createClient } from "@/lib/supabase/server";
import type { PermissionAction } from "@/lib/constants";

export async function hasMarketingPermission(
  userId: string,
  action: PermissionAction,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("has_permission", {
    p_user_id: userId,
    p_module_slug: "marketing",
    p_action: action,
  });
  if (error) return false;
  return Boolean(data);
}

export async function requireMarketingPermission(
  userId: string,
  action: PermissionAction,
): Promise<void> {
  const ok = await hasMarketingPermission(userId, action);
  if (!ok) throw new Error("Sem permissão no módulo Marketing.");
}
