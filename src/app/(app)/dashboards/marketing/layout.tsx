import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { hasMarketingPermission } from "@/lib/auth/marketing";

/** Gate de permissão do Dashboard de Marketing (marketing.read). Seção 1/10. */
export default async function MarketingDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  const canRead = await hasMarketingPermission(session.user.id, "read");
  if (!canRead) redirect("/dashboards");
  return <>{children}</>;
}
