import type { PostErrorLog, PostWithRelations } from "@/types/marketing";

const STAGE_LABELS: Record<PostErrorLog["stage"], string> = {
  agendamento: "Agendamento",
  publicacao: "Publicação",
};

type Props = {
  post: PostWithRelations;
  errorLogs: PostErrorLog[];
};

export function PostErrorAlert({ post, errorLogs }: Props) {
  if (post.status !== "falhou") return null;

  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
      <p className="font-semibold text-destructive">Falha na publicação</p>
      <p className="mt-1 text-destructive">
        {post.last_error_message ?? "Erro desconhecido"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {post.publish_attempts} tentativa(s)
        {post.last_error_at
          ? ` · última em ${new Date(post.last_error_at).toLocaleString("pt-BR")}`
          : ""}
        {" · "}Corrija o problema e use Agendar ou Publicar agora para tentar
        novamente.
      </p>
      {errorLogs.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
            Histórico de erros ({errorLogs.length})
          </summary>
          <ul className="mt-2 space-y-1.5">
            {errorLogs.map((log) => (
              <li key={log.id} className="text-xs text-muted-foreground">
                <span className="font-medium">
                  {new Date(log.created_at).toLocaleString("pt-BR")}
                </span>{" "}
                · {STAGE_LABELS[log.stage]}
                {log.attempt ? ` · tentativa ${log.attempt}` : ""} —{" "}
                {log.error_message}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
