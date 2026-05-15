import Image from "next/image";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  message?: string;
  className?: string;
  compact?: boolean;
}

export function LoadingScreen({
  message = "Carregando...",
  className,
  compact = false,
}: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        compact ? "py-8" : "min-h-[280px] py-12",
        className,
      )}
    >
      <Image
        src="/imbil-logo.svg"
        alt="Imbil"
        width={compact ? 140 : 180}
        height={compact ? 42 : 54}
        priority
        className="h-auto w-[140px] sm:w-[180px]"
      />
      <div className="flex flex-col items-center gap-3">
        <span className="relative flex h-10 w-10 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/30" />
          <span className="relative inline-flex h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </span>
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
