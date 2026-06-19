"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Controle de paginação simples (cliente) para grids de conteúdo. */
export function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" /> Anterior
      </Button>
      <span className="text-sm tabular-nums text-muted-foreground">
        Página {page} de {pageCount}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        Próxima <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
