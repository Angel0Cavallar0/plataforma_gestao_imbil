import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { hasMarketingPermission } from "@/lib/auth/marketing";

/** Gate de permissão do submódulo Insights (marketing.read). Seção 12.3. */
export default async function InsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  const canRead = await hasMarketingPermission(session.user.id, "read");
  if (!canRead) redirect("/");
  return <>{children}</>;
}
