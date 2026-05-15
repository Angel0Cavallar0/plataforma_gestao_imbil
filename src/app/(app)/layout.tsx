import { AppSidebar } from "@/components/layout/app-sidebar";
import { getNavPermissions, requireAuth } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const nav = await getNavPermissions(session.profile);

  return (
    <div className="flex h-dvh overflow-hidden">
      <AppSidebar profile={session.profile} nav={nav} />
      <main className="min-h-0 flex-1 overflow-y-auto bg-background p-6">{children}</main>
    </div>
  );
}
