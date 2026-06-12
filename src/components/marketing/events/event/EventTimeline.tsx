import { EVENT_STATUS_LABELS } from "@/lib/constants/marketing-events";
import type { EventStatusHistoryEntry } from "@/types/marketing-events";

export function EventTimeline({ entries }: { entries: EventStatusHistoryEntry[] }) {
  if (!entries.length) {
    return <p className="text-sm text-muted-foreground">Sem histórico de status.</p>;
  }
  return (
    <ol className="space-y-3 border-l pl-4">
      {entries.map((entry) => (
        <li key={entry.id} className="relative">
          <span className="absolute -left-[1.4rem] top-1.5 h-2 w-2 rounded-full bg-primary" />
          <p className="text-sm">
            {entry.from_status ? (
              <>
                {EVENT_STATUS_LABELS[entry.from_status]} →{" "}
                <span className="font-medium">
                  {EVENT_STATUS_LABELS[entry.to_status]}
                </span>
              </>
            ) : (
              <>
                Criado como{" "}
                <span className="font-medium">
                  {EVENT_STATUS_LABELS[entry.to_status]}
                </span>
              </>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(entry.created_at).toLocaleString("pt-BR")}
            {entry.changed_by_profile?.full_name
              ? ` · ${entry.changed_by_profile.full_name}`
              : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}
