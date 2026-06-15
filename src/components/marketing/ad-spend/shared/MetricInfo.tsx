import { cn } from "@/lib/utils";

/**
 * Pequeno ícone de interrogação (?) que, ao passar o mouse, exibe a descrição
 * da métrica/card. Usa o atributo nativo `title` (mesmo padrão dos demais
 * tooltips do app), funcionando em tema claro e escuro sem dependências extras.
 */
export function MetricInfo({ text, className }: { text: string; className?: string }) {
  return (
    <span
      role="img"
      aria-label={text}
      title={text}
      className={cn(
        "ml-1 inline-flex h-3.5 w-3.5 shrink-0 cursor-help select-none items-center justify-center rounded-full border border-muted-foreground/40 align-middle text-[9px] font-semibold leading-none text-muted-foreground hover:border-foreground hover:text-foreground",
        className,
      )}
    >
      ?
    </span>
  );
}
