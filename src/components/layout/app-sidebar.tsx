"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, Settings, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MARKETING_SUBMODULES } from "@/lib/constants/marketing";
import { SidebarUserFooter } from "@/components/layout/sidebar-user-footer";
import type { NavPermissions, UserProfile } from "@/types/auth";

interface AppSidebarProps {
  profile: UserProfile;
  nav: NavPermissions;
}

export function AppSidebar({ profile, nav }: AppSidebarProps) {
  const pathname = usePathname();

  const linkClass = (href: string) =>
    cn(
      "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
      pathname === href || pathname.startsWith(href + "/")
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    );

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col overflow-visible border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 shrink-0 items-center justify-center border-b border-sidebar-border px-4">
        <Link href="/" className="flex items-center justify-center">
          <Image
            src="/imbil-logo.svg"
            alt="Imbil"
            width={130}
            height={40}
            className="h-9 w-auto"
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <Link href="/" className={linkClass("/")}>
          <Home className="h-4 w-4 shrink-0" />
          Home
        </Link>
        <Link href="/dashboards" className={linkClass("/dashboards")}>
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          Dashboards
        </Link>

        <div className="pt-2">
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/50">
            Módulos
          </p>
          {nav.modules.map((mod) => (
            <details key={mod.slug} className="group">
              <summary
                className={cn(
                  linkClass(`/modulos/${mod.slug}`),
                  "cursor-pointer list-none [&::-webkit-details-marker]:hidden",
                )}
              >
                <span className="flex-1">{mod.name}</span>
                <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" />
              </summary>
              <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-2">
                {mod.slug === "marketing" ? (
                  MARKETING_SUBMODULES.map((sub) => (
                    <Link
                      key={sub.slug}
                      href={sub.href}
                      className={cn(
                        "block rounded-md px-2 py-1 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground",
                        pathname === sub.href || pathname.startsWith(sub.href + "/")
                          ? "bg-sidebar-accent/50 text-sidebar-foreground"
                          : "",
                      )}
                    >
                      {sub.name}
                    </Link>
                  ))
                ) : (
                  <>
                    <Link
                      href={`/modulos/${mod.slug}`}
                      className="block rounded-md px-2 py-1 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground"
                    >
                      Visão geral
                    </Link>
                    <span className="block px-2 py-1 text-xs text-sidebar-foreground/40">
                      Sub-serviços — em breve
                    </span>
                  </>
                )}
              </div>
            </details>
          ))}
        </div>

        {nav.canAccessConfig && (
          <Link href="/configuracoes/usuarios" className={linkClass("/configuracoes")}>
            <Settings className="h-4 w-4 shrink-0" />
            Configurações
          </Link>
        )}
      </nav>

      <div className="shrink-0 overflow-visible border-t border-sidebar-border">
        <SidebarUserFooter profile={profile} />
      </div>
    </aside>
  );
}
