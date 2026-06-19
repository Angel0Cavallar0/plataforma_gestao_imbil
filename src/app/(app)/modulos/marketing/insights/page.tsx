import { redirect } from "next/navigation";

/** Aba default ao abrir "Insights": Redes Sociais (Seção 1). */
export default function InsightsIndexPage() {
  redirect("/modulos/marketing/insights/redes-sociais");
}
