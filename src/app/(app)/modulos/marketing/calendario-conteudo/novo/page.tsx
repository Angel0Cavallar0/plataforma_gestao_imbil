import Link from "next/link";
import { PostForm } from "@/components/marketing/calendar/PostForm";
import {
  getActivePlatforms,
  getCampaigns,
  getMetaCredentials,
} from "@/server/queries/marketing/content";

export default async function NovoPostPage() {
  const [platforms, campaigns, credentials] = await Promise.all([
    getActivePlatforms(),
    getCampaigns(),
    getMetaCredentials(),
  ]);

  const socialPlatforms = platforms.filter((p) =>
    ["instagram", "facebook"].includes(p.slug),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/modulos/marketing/calendario-conteudo"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Voltar ao calendário
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Novo post</h1>
      </div>
      <PostForm
        platforms={socialPlatforms}
        campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))}
        credentials={credentials.map((c) => ({
          id: c.id as string,
          label: c.label as string,
          platform_id: c.platform_id as string,
        }))}
      />
    </div>
  );
}
