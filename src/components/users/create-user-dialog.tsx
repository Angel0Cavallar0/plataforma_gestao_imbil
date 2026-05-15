"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createUserAction } from "@/server/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RoleOption {
  id: string;
  name: string;
  slug: string;
}

interface ModuleOption {
  id: string;
  name: string;
}

interface DepartmentOption {
  id: string;
  name: string;
  parent_id: string | null;
  responsible_id: string | null;
}

interface PositionOption {
  id: string;
  name: string;
  department_id: string | null;
}

interface ManagerOption {
  id: string;
  full_name: string;
}

interface CreateUserDialogProps {
  roles: RoleOption[];
  modules: ModuleOption[];
  departments: DepartmentOption[];
  positions: PositionOption[];
  managers: ManagerOption[];
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50";

export function CreateUserDialog({
  roles,
  modules,
  departments,
  positions,
  managers,
}: CreateUserDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sectorId, setSectorId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [managerId, setManagerId] = useState("");

  const sectors = useMemo(
    () => departments.filter((d) => d.parent_id === null),
    [departments],
  );

  const sectorDepartments = useMemo(
    () => departments.filter((d) => d.parent_id === sectorId),
    [departments, sectorId],
  );

  const departmentPositions = useMemo(
    () => positions.filter((p) => p.department_id === departmentId),
    [positions, departmentId],
  );

  const selectedDepartment = departments.find((d) => d.id === departmentId);

  function resetOrgFields() {
    setSectorId("");
    setDepartmentId("");
    setPositionId("");
    setManagerId("");
  }

  function handleSectorChange(nextSectorId: string) {
    setSectorId(nextSectorId);
    setDepartmentId("");
    setPositionId("");
    setManagerId("");
  }

  function handleDepartmentChange(nextDepartmentId: string) {
    setDepartmentId(nextDepartmentId);
    setPositionId("");
    const dept = departments.find((d) => d.id === nextDepartmentId);
    if (dept?.responsible_id) {
      setManagerId(dept.responsible_id);
    } else {
      setManagerId("");
    }
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    setIsSubmitting(true);
    try {
      if (departmentId) formData.set("department_id", departmentId);
      if (positionId) formData.set("position_id", positionId);
      if (managerId) formData.set("manager_id", managerId);

      const result = await createUserAction(formData);
      if (typeof result.error === "string") {
        setError(result.error);
      } else if (result.error) {
        setError("Verifique os campos.");
      } else {
        setOpen(false);
        resetOrgFields();
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!isSubmitting) {
      setOpen(nextOpen);
      if (!nextOpen) {
        setError(null);
        resetOrgFields();
      }
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Criar novo usuário</Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para enviar o convite de cadastro por e-mail.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="full_name">Nome completo</Label>
                <Input id="full_name" name="full_name" required disabled={isSubmitting} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">E-mail corporativo</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="registration_number">Registro interno</Label>
                <Input
                  id="registration_number"
                  name="registration_number"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="role_id">Nível de perfil</Label>
                <select
                  id="role_id"
                  name="role_id"
                  required
                  disabled={isSubmitting}
                  className={selectClassName}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="sector_id">Setor</Label>
                <select
                  id="sector_id"
                  value={sectorId}
                  onChange={(e) => handleSectorChange(e.target.value)}
                  disabled={isSubmitting || sectors.length === 0}
                  className={selectClassName}
                >
                  <option value="">Selecione...</option>
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="department_id">Departamento</Label>
                <select
                  id="department_id"
                  value={departmentId}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  disabled={isSubmitting || !sectorId}
                  className={selectClassName}
                >
                  <option value="">Selecione...</option>
                  {sectorDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="position_id">Cargo</Label>
                <select
                  id="position_id"
                  value={positionId}
                  onChange={(e) => setPositionId(e.target.value)}
                  disabled={isSubmitting || !departmentId}
                  className={selectClassName}
                >
                  <option value="">Selecione...</option>
                  {departmentPositions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="manager_id">Gestor direto</Label>
                <select
                  id="manager_id"
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  disabled={isSubmitting}
                  className={selectClassName}
                >
                  <option value="">Nenhum</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name}
                    </option>
                  ))}
                </select>
                {selectedDepartment?.responsible_id &&
                  managerId === selectedDepartment.responsible_id && (
                    <p className="text-xs text-muted-foreground">
                      Pré-preenchido com o responsável do departamento.
                    </p>
                  )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="admission_date">Data de admissão</Label>
                <Input
                  id="admission_date"
                  name="admission_date"
                  type="date"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Módulos (obrigatório para operação)</Label>
              <div className="flex flex-wrap gap-2">
                {modules.map((m) => (
                  <label key={m.id} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      name="module_ids"
                      value={m.id}
                      disabled={isSubmitting}
                    />
                    {m.name}
                  </label>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                variant={isSubmitting ? "secondary" : "default"}
                className={isSubmitting ? "opacity-60" : undefined}
              >
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
