"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/configuracoes/usuarios", label: "Usuários e Permissões" },
  { href: "/configuracoes/modulos", label: "Parâmetros dos Módulos" },
  { href: "/configuracoes/auditoria", label: "Logs de Auditoria" },
];

export function ConfigNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-border">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            pathname.startsWith(tab.href)
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
