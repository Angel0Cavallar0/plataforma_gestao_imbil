"use client";

import { Check } from "lucide-react";
import { getPasswordRequirementStatuses } from "@/lib/auth/password-requirements";
import { cn } from "@/lib/utils";

interface PasswordRequirementsChecklistProps {
  password: string;
  confirmPassword: string;
}

export function PasswordRequirementsChecklist({
  password,
  confirmPassword,
}: PasswordRequirementsChecklistProps) {
  const statuses = getPasswordRequirementStatuses(password, confirmPassword);

  return (
    <ul
      className="space-y-2 rounded-md border border-border/60 bg-muted/30 p-3"
      aria-live="polite"
    >
      {statuses.map((item) => (
        <li key={item.id} className="flex items-center gap-2 text-sm">
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
              item.met
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/40 bg-background text-transparent",
            )}
            aria-hidden
          >
            <Check className="size-3 stroke-[3]" />
          </span>
          <span className={cn(item.met ? "text-foreground" : "text-muted-foreground")}>
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
