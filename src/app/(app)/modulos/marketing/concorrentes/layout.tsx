import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { hasMarketingPermission } from "@/lib/auth/marketing";

/** Gate de permissão do submódulo Concorrentes (marketing.read). Seção 15. */
export default async function ConcorrentesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  const canRead = await hasMarketingPermission(session.user.id, "read");
  if (!canRead) redirect("/");
  return <>{children}</>;
}
