"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  ChevronsUpDown,
  LogOut,
  Monitor,
  Moon,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { THEME_PREFERENCES, type ThemePreference } from "@/lib/constants";
import { ProfileAvatar } from "@/components/ui/avatar";
import { logoutAction } from "@/server/actions/auth";
import { updateThemePreferenceAction } from "@/server/actions/profile";
import type { UserProfile } from "@/types/auth";

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

interface SidebarUserFooterProps {
  profile: UserProfile;
}

export function SidebarUserFooter({ profile }: SidebarUserFooterProps) {
  const [open, setOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTheme = (
    THEME_PREFERENCES.includes(theme as ThemePreference)
      ? theme
      : profile.theme_preference
  ) as ThemePreference | undefined;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setThemeMenuOpen(false);
      }
    }
    if (open) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [open]);

  async function handleThemeSelect(value: ThemePreference) {
    setTheme(value);
    setThemeMenuOpen(false);
    setOpen(false);
    await updateThemePreferenceAction(value);
  }

  const ThemeIcon = THEME_OPTIONS.find((o) => o.value === activeTheme)?.icon ?? Monitor;

  return (
    <div ref={containerRef} className="relative p-2">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setThemeMenuOpen(false);
        }}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-2 text-left text-sm transition-colors",
          "hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          open && "bg-sidebar-accent",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <ProfileAvatar
          src={profile.avatar_url}
          name={profile.full_name}
          className="h-8 w-8 text-xs"
        />
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">{profile.full_name}</span>
          <span className="truncate text-xs text-sidebar-foreground/60">
            {profile.email}
          </span>
        </div>
        <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-sidebar-foreground/60" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-2 left-full z-50 ml-2 min-w-[12rem] overflow-visible rounded-lg border border-sidebar-border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          <Link
            href="/perfil"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              setOpen(false);
              setThemeMenuOpen(false);
            }}
          >
            <User className="h-4 w-4" />
            Meu perfil
          </Link>

          <div className="relative">
            <button
              type="button"
              role="menuitem"
              aria-expanded={themeMenuOpen}
              aria-haspopup="menu"
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                themeMenuOpen && "bg-accent text-accent-foreground",
              )}
              onClick={() => setThemeMenuOpen((v) => !v)}
            >
              <ThemeIcon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Alternar tema</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>

            {themeMenuOpen && (
              <div
                role="menu"
                className="absolute bottom-0 left-full z-50 ml-1 min-w-[10rem] overflow-hidden rounded-lg border border-sidebar-border bg-popover p-1 text-popover-foreground shadow-lg"
              >
                {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
                  const isActive = activeTheme === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isActive}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                        isActive && "bg-accent/80",
                      )}
                      onClick={() => handleThemeSelect(value)}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left">{label}</span>
                      {isActive && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <form action={logoutAction} className="w-full">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
