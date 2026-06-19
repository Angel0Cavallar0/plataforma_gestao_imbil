import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { hasMarketingPermission } from "@/lib/auth/marketing";
import { getSocialPosts } from "@/server/queries/marketing/insights";
import { getCrossPostLookup } from "@/server/queries/marketing/cross-posts";
import { friendlyContentType } from "@/lib/constants/marketing-insights";
import { ContentPostsFilters } from "@/components/marketing/content-posts/ContentPostsFilters";
import { ContentPostList } from "@/components/marketing/content-posts/ContentPostList";
import type { SocialNetwork } from "@/types/marketing-insights";

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Resolve o mês (YYYY-MM) e o intervalo de datas; default = mês atual. */
function resolveMonth(raw: string | undefined): {
  month: string;
  from: string;
  to: string;
} {
  const monthRe = /^\d{4}-\d{2}$/;
  const now = new Date();
  const month =
    raw && monthRe.test(raw)
      ? raw
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, mon] = month.split("-").map(Number);
  const lastDay = new Date(year, mon, 0).getDate();
  return {
    month,
    from: `${month}-01`,
    to: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

function parseNetwork(value: string | undefined): SocialNetwork | null {
  return value === "instagram" || value === "facebook" || value === "linkedin"
    ? value
    : null;
}

export default async function ConteudosPostadosPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const session = await requireAuth();
  if (!(await hasMarketingPermission(session.user.id, "read"))) redirect("/");

  const sp = await searchParams;
  const { month, from, to } = resolveMonth(firstParam(sp.month));
  const network = parseNetwork(firstParam(sp.network));
  const typeFilter = firstParam(sp.type) ?? null;

  const [posts, crossPost] = await Promise.all([
    getSocialPosts({ date_from: from, date_to: to }, network ?? undefined),
    getCrossPostLookup(),
  ]);

  // Tipos presentes no período (alimenta o filtro secundário de tipo).
  const typeOptions = Array.from(
    new Set(
      posts.map((p) =>
        friendlyContentType(p.network, p.media_type, p.media_product_type),
      ),
    ),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const filtered = typeFilter
    ? posts.filter(
        (p) =>
          friendlyContentType(p.network, p.media_type, p.media_product_type) ===
          typeFilter,
      )
    : posts;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Conteúdos Postados</h1>
        <p className="text-sm text-muted-foreground">
          Todas as postagens publicadas no Instagram, Facebook e LinkedIn, em uma
          lista única por mês.
        </p>
      </div>

      <ContentPostsFilters
        month={month}
        network={network}
        type={typeFilter}
        typeOptions={typeOptions}
      />

      <ContentPostList posts={filtered} crossPost={crossPost} />
    </div>
  );
}
