"use client";

import { useTransition } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { exportCampaignsCsv } from "@/server/actions/marketing/ad-spend";
import type { AdSpendFilters } from "@/types/marketing-ads";

/** Dispara a exportação CSV das campanhas filtradas (com audit log). */
export function ExportCsvButton({ filters }: { filters: AdSpendFilters }) {
  const [pending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const res = await exportCampaignsCsv(filters);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const blob = new Blob([`﻿${res.csv}`], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exportação concluída.");
    });
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={pending}
      className={cn(buttonVariants({ variant: "outline" }))}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Export CSV
    </button>
  );
}
