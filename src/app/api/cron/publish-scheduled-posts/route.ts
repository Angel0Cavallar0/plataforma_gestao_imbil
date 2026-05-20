import { NextResponse } from "next/server";
import { processScheduledPostsAction } from "@/server/actions/marketing/content";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await processScheduledPostsAction();
    return NextResponse.json({ processed: results.length, results });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 500 },
    );
  }
}
