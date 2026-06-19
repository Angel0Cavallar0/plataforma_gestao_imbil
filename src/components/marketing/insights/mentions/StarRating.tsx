import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Estrelas (1–5) das avaliações do Google Meu Negócio (Seção 5.3). */
export function StarRating({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`${rating} de 5 estrelas`}
      title={`${rating} de 5 estrelas`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30",
          )}
        />
      ))}
    </span>
  );
}
