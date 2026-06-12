import { NextResponse } from "next/server";
import { processScheduledPosts } from "@/server/services/marketing/publish-scheduled";

/**
 * Disparo manual / desenvolvimento da publicação agendada.
 * Em produção o agendamento usa Supabase Edge Function + pg_cron (ver migration 009).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await processScheduledPosts();
    return NextResponse.json({
      source: "nextjs_api",
      processed: results.length,
      results,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 500 },
    );
  }
}
