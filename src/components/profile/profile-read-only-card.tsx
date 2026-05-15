import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ProfileReadOnlyData {
  full_name: string;
  email: string;
  registration_number: string;
  role_name: string;
  department_name: string | null;
  position_name: string | null;
  manager_name: string | null;
  admission_date: string | null;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value || "—"}</p>
    </div>
  );
}

export function ProfileReadOnlyCard({ data }: { data: ProfileReadOnlyData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados da empresa</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ReadOnlyField label="Nome completo" value={data.full_name} />
          <ReadOnlyField label="E-mail corporativo" value={data.email} />
          <ReadOnlyField label="Registro interno" value={data.registration_number} />
          <ReadOnlyField label="Nível de perfil" value={data.role_name} />
          <ReadOnlyField
            label="Setor / Departamento"
            value={data.department_name ?? "—"}
          />
          <ReadOnlyField label="Cargo" value={data.position_name ?? "—"} />
          <ReadOnlyField label="Gestor direto" value={data.manager_name ?? "—"} />
          <ReadOnlyField
            label="Data de admissão"
            value={formatDate(data.admission_date)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
