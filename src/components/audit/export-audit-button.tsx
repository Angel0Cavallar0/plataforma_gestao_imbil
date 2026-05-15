"use client";

import { exportAuditLogsCsv } from "@/server/actions/audit";
import { Button } from "@/components/ui/button";

export function ExportAuditButton() {
  async function handleExport() {
    const csv = await exportAuditLogsCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" onClick={handleExport}>
      Exportar CSV
    </Button>
  );
}
