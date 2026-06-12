import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PostStatusBadge } from "@/components/marketing/calendar/PostStatusBadge";
import { listPosts } from "@/server/queries/marketing/content";
import { CONTENT_TYPE_LABELS } from "@/lib/constants/marketing";
import { createClient } from "@/lib/supabase/server";
import { marketingSchema } from "@/lib/supabase/marketing";

export default async function ListaPostsPage() {
  const posts = await listPosts();
  const supabase = await createClient();
  const { data: platforms } = await marketingSchema(supabase)
    .from("platforms")
    .select("id, name");
  const platformMap = new Map(
    (platforms ?? []).map((p) => [p.id as string, p.name as string]),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Lista de posts</h1>
          <Link
            href="/modulos/marketing/calendario-conteudo"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Calendário
          </Link>
        </div>
        <Link
          href="/modulos/marketing/calendario-conteudo/novo"
          className={cn(buttonVariants())}
        >
          Novo post
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left">Título</th>
              <th className="px-4 py-2 text-left">Plataforma</th>
              <th className="px-4 py-2 text-left">Tipo</th>
              <th className="px-4 py-2 text-left">Agendado</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b last:border-0">
                <td className="px-4 py-2">
                  <Link
                    href={`/modulos/marketing/calendario-conteudo/${post.id}`}
                    className="font-medium hover:underline"
                  >
                    {post.title}
                  </Link>
                  {post.copy && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {post.copy}
                    </p>
                  )}
                </td>
                <td className="px-4 py-2">{platformMap.get(post.platform_id) ?? "—"}</td>
                <td className="px-4 py-2">{CONTENT_TYPE_LABELS[post.content_type]}</td>
                <td className="px-4 py-2">
                  {new Date(post.scheduled_at).toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-2">
                  <PostStatusBadge status={post.status} />
                  {post.status === "falhou" && post.last_error_message && (
                    <p
                      className="mt-1 line-clamp-2 max-w-[280px] text-xs text-destructive"
                      title={post.last_error_message}
                    >
                      {post.last_error_message}
                    </p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!posts.length && (
          <p className="p-8 text-center text-muted-foreground">Nenhum post cadastrado.</p>
        )}
      </div>
    </div>
  );
}
