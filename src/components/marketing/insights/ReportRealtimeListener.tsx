"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { completeReportRequest } from "@/server/actions/marketing/reports";

/**
 * Detecção de relatório pronto via Supabase Realtime (Seção 10). Em INSERT na
 * marketing_reports: avisa, fecha a solicitação aberta e atualiza a página.
 * Mantém um polling de retaguarda (30s por ~8 min) armado pela solicitação,
 * caso o Realtime caia (Seção 10.3).
 */
export function ReportRealtimeListener() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let pollStop: ReturnType<typeof setTimeout> | null = null;

    const stopPolling = () => {
      if (pollTimer) clearInterval(pollTimer);
      if (pollStop) clearTimeout(pollStop);
      pollTimer = null;
      pollStop = null;
    };
    const startPolling = () => {
      stopPolling();
      pollTimer = setInterval(() => router.refresh(), 30_000);
      pollStop = setTimeout(stopPolling, 8 * 60_000);
    };

    const channel = supabase
      .channel("marketing_reports_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "marketing", table: "marketing_reports" },
        (payload) => {
          const novo = payload.new as { id?: string };
          toast.success("Relatório disponível!");
          if (novo?.id) void completeReportRequest(novo.id);
          stopPolling();
          window.dispatchEvent(new CustomEvent("mkt-report-ready"));
          router.refresh();
        },
      )
      .subscribe();

    const onRequested = () => startPolling();
    window.addEventListener("mkt-report-requested", onRequested);

    return () => {
      window.removeEventListener("mkt-report-requested", onRequested);
      stopPolling();
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
