import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";
import { headers } from "next/headers";

export interface AuditLogInput {
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export async function logAction(input: AuditLogInput): Promise<void> {
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    null;
  const userAgent = headersList.get("user-agent");

  const admin = createAdminClient();
  await admin.from("audit_logs").insert({
    user_id: input.userId,
    action: input.action,
    resource_type: input.resourceType,
    resource_id: input.resourceId ?? null,
    ip_address: ip,
    user_agent: userAgent,
    metadata: (input.metadata as Json) ?? null,
  });
}
