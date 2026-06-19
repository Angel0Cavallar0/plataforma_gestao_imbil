import { createClient } from "@/lib/supabase/server";
import { marketingSchema } from "@/lib/supabase/marketing";
import type { SocialNetwork } from "@/types/marketing-insights";

/** `${network}:${id}` → outras redes em que o mesmo conteúdo foi publicado. */
export type CrossPostLookup = Record<string, SocialNetwork[]>;

/**
 * Lê marketing.cross_post_links e monta, para cada post, as OUTRAS redes onde o
 * mesmo conteúdo aparece. Inclui o LinkedIn (`linkedin_post_id`). Retorna um
 * objeto serializável (chave `${network}:${id}`).
 */
export async function getCrossPostLookup(): Promise<CrossPostLookup> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("cross_post_links")
    .select("instagram_media_id, facebook_post_id, linkedin_post_id");

  if (error) {
    // Tabela alimentada por workflow externo — não derrubar a página por isso.
    console.error(`Falha ao ler cross_post_links: ${error.message}`);
    return {};
  }

  const sets: Record<string, Set<SocialNetwork>> = {};

  for (const row of (data ?? []) as Array<Record<string, string | null>>) {
    const members: Array<[SocialNetwork, string | null]> = [
      ["instagram", row.instagram_media_id],
      ["facebook", row.facebook_post_id],
      ["linkedin", row.linkedin_post_id],
    ];
    const present = members.filter(([, id]) => Boolean(id)) as Array<
      [SocialNetwork, string]
    >;
    if (present.length < 2) continue;

    for (const [net, id] of present) {
      const key = `${net}:${id}`;
      const set = (sets[key] ??= new Set<SocialNetwork>());
      for (const [other] of present) {
        if (other !== net) set.add(other);
      }
    }
  }

  const lookup: CrossPostLookup = {};
  for (const [key, set] of Object.entries(sets)) {
    lookup[key] = [...set];
  }
  return lookup;
}
