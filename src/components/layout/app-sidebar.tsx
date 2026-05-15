"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  Settings,
  ChevronDown,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { NavPermissions, UserProfile } from "@/types/auth";
import { logoutAction } from "@/server/actions/auth";

interface AppSidebarProps {
  profile: UserProfile;
  nav: NavPermissions;
}

export function AppSidebar({ profile, nav }: AppSidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const linkClass = (href: string) =>
    cn(
      "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
      pathname === href || pathname.startsWith(href + "/")
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    );

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <Image src="/imbil-logo.svg" alt="Imbil" width={120} height={32} className="h-8 w-auto" />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <Link href="/" className={linkClass("/")}>
          <Home className="h-4 w-4" />
          Home
        </Link>
        <Link href="/dashboards" className={linkClass("/dashboards")}>
          <LayoutDashboard className="h-4 w-4" />
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
                <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
              </summary>
              <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-2">
                <Link
                  href={`/modulos/${mod.slug}`}
                  className="block rounded-md px-2 py-1 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground"
                >
                  Visão geral
                </Link>
                <span className="block px-2 py-1 text-xs text-sidebar-foreground/40">
                  Sub-serviços — em breve
                </span>
              </div>
            </details>
          ))}
        </div>

        {nav.canAccessConfig && (
          <Link href="/configuracoes/usuarios" className={linkClass("/configuracoes")}>
            <Settings className="h-4 w-4" />
            Configurações
          </Link>
        )}
      </nav>

      <div className="border-t border-sidebar-border p-3 space-y-2">
        <div className="px-2 text-sm">
          <p className="font-medium truncate">{profile.full_name}</p>
          <p className="text-xs text-sidebar-foreground/60 truncate">{profile.role_name}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          Alternar tema
        </Button>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </form>
      </div>
    </aside>
  );
}
