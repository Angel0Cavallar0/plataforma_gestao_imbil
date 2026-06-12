import { EventForm } from "@/components/marketing/events/event/EventForm";

export default function NovoEventoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Novo evento</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre a participação da Imbil em um evento ou feira.
        </p>
      </div>
      <EventForm />
    </div>
  );
}
