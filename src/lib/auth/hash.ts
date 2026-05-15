export type ParsedAuthHash = {
  accessToken: string | null;
  refreshToken: string | null;
  type: string | null;
  error: string | null;
  errorCode: string | null;
  errorDescription: string | null;
};

export function parseAuthHash(hash: string): ParsedAuthHash | null {
  if (!hash || hash === "#") return null;

  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);

  return {
    accessToken: params.get("access_token"),
    refreshToken: params.get("refresh_token"),
    type: params.get("type"),
    error: params.get("error"),
    errorCode: params.get("error_code"),
    errorDescription: params.get("error_description"),
  };
}

export function getPasswordPathForAuthType(
  type: string | null,
): "/cadastrar-senha" | "/trocar-senha" {
  if (type === "recovery") return "/trocar-senha";
  return "/cadastrar-senha";
}

export function formatAuthHashError(parsed: ParsedAuthHash): string {
  if (parsed.errorCode === "otp_expired") {
    return "O link do e-mail expirou ou já foi utilizado. Peça ao gestor para reenviar o convite ou a troca de senha.";
  }

  if (parsed.errorDescription) {
    return decodeURIComponent(parsed.errorDescription.replace(/\+/g, " "));
  }

  return "Não foi possível validar o link de acesso. Solicite um novo envio ao seu gestor.";
}
