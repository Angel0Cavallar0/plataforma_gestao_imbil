import { PasswordForm } from "@/components/auth/password-form";

export default async function CadastrarSenhaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PasswordForm token={token} type="cadastrar" />;
}
