/** Formata celular BR: (DD) 9XXXX-XXXX — até 11 dígitos. */
export function formatBrazilPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Aceita valor salvo com ou sem máscara e devolve formato visual. */
export function normalizeBrazilPhoneDisplay(value: string | null | undefined): string {
  if (!value) return "";
  return formatBrazilPhone(value);
}
