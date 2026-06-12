import { Badge } from "@/components/ui/badge";
import { expirationInfo } from "@/lib/marketing/lead-form-status";

export function FormExpirationBadge({ expiresAt }: { expiresAt: string }) {
  const info = expirationInfo(expiresAt);

  return (
    <span className="text-sm">
      {info.dateLabel}{" "}
      <Badge variant={info.expired || info.urgent ? "destructive" : "muted"}>
        {info.countdown}
      </Badge>
    </span>
  );
}
