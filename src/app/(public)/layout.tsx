// O body do layout raiz usa h-dvh + overflow-hidden (padrão da área autenticada,
// que tem seu próprio container de scroll). As rotas públicas precisam deste
// wrapper para a página do formulário poder rolar.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-dvh overflow-y-auto bg-slate-50">{children}</div>;
}
