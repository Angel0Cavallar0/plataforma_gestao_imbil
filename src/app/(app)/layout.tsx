import { AppSidebar } from "@/components/layout/app-sidebar";
import { getNavPermissions, requireAuth } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  const nav = await getNavPermissions(session.profile);

  return (
    <div className="flex min-h-screen">
      <AppSidebar profile={session.profile} nav={nav} />
      <main className="flex-1 overflow-auto bg-background p-6">{children}</main>
    </div>
  );
}
