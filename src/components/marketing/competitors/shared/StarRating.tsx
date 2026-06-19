import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Estrelas de avaliação (0–5). Suporta meia-estrela visual via arredondamento. */
export function StarRating({
  rating,
  size = 14,
  className,
}: {
  rating: number | null | undefined;
  size?: number;
  className?: string;
}) {
  if (rating == null) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  const rounded = Math.round(rating);
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`${rating} de 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          width={size}
          height={size}
          className={cn(
            i < rounded
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-muted-foreground/40",
          )}
        />
      ))}
    </span>
  );
}
