"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createDepartmentBundleAction } from "@/server/actions/org";
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

interface RowKey {
  key: string;
  name: string;
}

interface ManagerOption {
  id: string;
  full_name: string;
}

interface CreateDepartmentBundleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  managerCandidates: ManagerOption[];
  onSuccess: () => void;
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50";

function newKey(): string {
  return crypto.randomUUID();
}

export function CreateDepartmentBundleDialog({
  open,
  onOpenChange,
  managerCandidates,
  onSuccess,
}: CreateDepartmentBundleDialogProps) {
  const [deptName, setDeptName] = useState("");
  const [responsibleName, setResponsibleName] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [sectors, setSectors] = useState<
    { key: string; name: string; positions: RowKey[] }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addSector() {
    setSectors((prev) => [...prev, { key: newKey(), name: "", positions: [] }]);
  }

  function removeSector(key: string) {
    setSectors((prev) => prev.filter((s) => s.key !== key));
  }

  function updateSectorName(key: string, name: string) {
    setSectors((prev) => prev.map((s) => (s.key === key ? { ...s, name } : s)));
  }

  function addPosition(sectorKey: string) {
    setSectors((prev) =>
      prev.map((s) =>
        s.key === sectorKey
          ? { ...s, positions: [...s.positions, { key: newKey(), name: "" }] }
          : s,
      ),
    );
  }

  function removePosition(sectorKey: string, positionKey: string) {
    setSectors((prev) =>
      prev.map((s) =>
        s.key === sectorKey
          ? { ...s, positions: s.positions.filter((p) => p.key !== positionKey) }
          : s,
      ),
    );
  }

  function updatePositionName(sectorKey: string, positionKey: string, name: string) {
    setSectors((prev) =>
      prev.map((s) =>
        s.key === sectorKey
          ? {
              ...s,
              positions: s.positions.map((p) =>
                p.key === positionKey ? { ...p, name } : p,
              ),
            }
          : s,
      ),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const nameTrim = deptName.trim();
    if (nameTrim.length < 2) {
      setError("Informe o nome do departamento.");
      return;
    }

    for (const s of sectors) {
      const sn = s.name.trim();
      const hasCargo = s.positions.some((p) => p.name.trim().length > 0);
      if (!sn && hasCargo) {
        setError("Informe o nome do setor onde há cargos preenchidos.");
        return;
      }
      if (sn.length > 0 && sn.length < 2) {
        setError("Cada setor precisa de pelo menos 2 caracteres no nome.");
        return;
      }
    }

    const payload = {
      name: nameTrim,
      responsible_name: responsibleName.trim() || null,
      responsible_id: responsibleId ? responsibleId : null,
      sectors: sectors
        .filter((s) => s.name.trim().length >= 2)
        .map((s) => ({
          name: s.name.trim(),
          positions: s.positions.map((p) => p.name.trim()).filter((n) => n.length > 0),
        })),
    };

    setIsSubmitting(true);
    try {
      const result = await createDepartmentBundleAction(payload);
      if (typeof result.error === "string") {
        setError(result.error);
      } else if (result.error) {
        setError("Verifique os campos.");
      } else {
        onOpenChange(false);
        onSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDialogOpenChange(next: boolean) {
    if (!isSubmitting) {
      onOpenChange(next);
      if (!next) setError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo departamento</DialogTitle>
          <DialogDescription>
            Cadastre o departamento e, na mesma tela, adicione setores e os cargos
            necessários para vincular usuários.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3 rounded-md border border-border p-4">
            <p className="text-xs font-medium text-muted-foreground">Departamento</p>
            <div className="space-y-1">
              <Label htmlFor="bundle_dept_name">Nome do departamento</Label>
              <Input
                id="bundle_dept_name"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                required
                minLength={2}
                disabled={isSubmitting}
                placeholder="Ex.: Operações"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bundle_responsible_name">Nome do responsável</Label>
              <Input
                id="bundle_responsible_name"
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                disabled={isSubmitting}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bundle_responsible_id">Vincular usuário responsável</Label>
              <select
                id="bundle_responsible_id"
                value={responsibleId}
                onChange={(e) => setResponsibleId(e.target.value)}
                disabled={isSubmitting}
                className={selectClassName}
              >
                <option value="">Nenhum</option>
                {managerCandidates.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                Setores e cargos (opcional)
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSector}
                disabled={isSubmitting}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Adicionar setor
              </Button>
            </div>

            {sectors.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum setor ainda. Use &quot;Adicionar setor&quot; para incluir um ou
                mais setores e seus cargos.
              </p>
            ) : (
              <ul className="space-y-4">
                {sectors.map((sector, idx) => (
                  <li
                    key={sector.key}
                    className="rounded-md border border-border bg-muted/20 p-3 space-y-3"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-1">
                        <Label htmlFor={`sector-${sector.key}`}>Setor {idx + 1}</Label>
                        <Input
                          id={`sector-${sector.key}`}
                          value={sector.name}
                          onChange={(e) => updateSectorName(sector.key, e.target.value)}
                          disabled={isSubmitting}
                          placeholder="Nome do setor"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-6 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeSector(sector.key)}
                        disabled={isSubmitting}
                        aria-label="Remover setor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2 pl-1 border-l-2 border-border ml-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">Cargos</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          onClick={() => addPosition(sector.key)}
                          disabled={isSubmitting}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Cargo
                        </Button>
                      </div>
                      {sector.positions.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Nenhum cargo. Adicione ao menos um cargo para poder atribuir
                          perfil na criação de usuário.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {sector.positions.map((pos, pidx) => (
                            <li key={pos.key} className="flex items-center gap-2">
                              <Input
                                value={pos.name}
                                onChange={(e) =>
                                  updatePositionName(sector.key, pos.key, e.target.value)
                                }
                                disabled={isSubmitting}
                                placeholder={`Cargo ${pidx + 1}`}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0 h-9 w-9 text-muted-foreground hover:text-destructive"
                                onClick={() => removePosition(sector.key, pos.key)}
                                disabled={isSubmitting}
                                aria-label="Remover cargo"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Criar departamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
