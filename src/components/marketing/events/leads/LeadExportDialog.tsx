"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { exportLeadsAction } from "@/server/actions/marketing/leads";
import type { LeadFilters } from "@/types/marketing-events";

export function LeadExportDialog({ filters }: { filters: LeadFilters }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function exportCsv(purpose: "operacional" | "marketing") {
    startTransition(async () => {
      const res = await exportLeadsAction(filters, purpose);
      if (res.error || !res.data) {
        toast.error(res.error ?? "Erro ao exportar");
        return;
      }
      const blob = new Blob(["﻿" + res.data.csv], {
        type: "text/csv;charset=utf-8",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `leads-${purpose}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(`${res.data.count} lead(s) exportado(s).`);
      setOpen(false);
    });
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Download className="mr-2 h-4 w-4" />
        Exportar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar leads (CSV)</DialogTitle>
            <DialogDescription>
              Qual a finalidade da exportação? A exportação para marketing inclui somente
              leads <strong>com consentimento LGPD</strong>. Ambas ficam registradas no
              audit log. Requer perfil supervisão+.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => exportCsv("operacional")}
            >
              Operacional (tudo)
            </Button>
            <Button disabled={pending} onClick={() => exportCsv("marketing")}>
              Marketing (com consentimento)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
