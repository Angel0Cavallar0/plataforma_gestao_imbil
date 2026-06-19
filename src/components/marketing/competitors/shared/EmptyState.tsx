import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

/** Estado vazio elegante — usado quando uma fonte não tem dados coletados. */
export function EmptyState({
  message = "Sem dados coletados.",
  icon,
  className,
}: {
  message?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center",
        className,
      )}
    >
      <span className="text-muted-foreground/60">
        {icon ?? <Inbox className="h-6 w-6" />}
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
