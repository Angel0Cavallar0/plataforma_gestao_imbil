export type LeadFormStatus = "ativo" | "inativo" | "expirado";

export function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= Date.now();
}

export function leadFormStatus(form: {
  is_active: boolean;
  expires_at: string;
}): LeadFormStatus {
  if (isExpired(form.expires_at)) return "expirado";
  return form.is_active ? "ativo" : "inativo";
}

/** Form público só aceita acesso com token correto, ativo e dentro da validade. */
export function isLeadFormOpen(
  form: {
    public_token: string;
    is_active: boolean;
    expires_at: string;
  },
  token: string,
): boolean {
  return form.public_token === token && form.is_active && !isExpired(form.expires_at);
}

export function expirationInfo(expiresAt: string): {
  dateLabel: string;
  expired: boolean;
  urgent: boolean;
  countdown: string;
} {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  const dateLabel = new Date(expiresAt).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  if (diffMs <= 0) {
    return { dateLabel, expired: true, urgent: false, countdown: "expirado" };
  }
  const hours = diffMs / (1000 * 60 * 60);
  const days = Math.floor(hours / 24);
  const countdown =
    days >= 1
      ? `em ${days} dia${days > 1 ? "s" : ""}`
      : `em ${Math.max(1, Math.floor(hours))}h`;
  return { dateLabel, expired: false, urgent: hours < 24, countdown };
}
