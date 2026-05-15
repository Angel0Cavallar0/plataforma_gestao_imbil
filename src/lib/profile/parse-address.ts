import type { AddressInput } from "@/lib/validations/profile";

export function parseAddressFromJson(value: unknown): AddressInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const obj = value as Record<string, unknown>;
  return {
    cep: typeof obj.cep === "string" ? obj.cep : null,
    street: typeof obj.street === "string" ? obj.street : null,
    number: typeof obj.number === "string" ? obj.number : null,
    complement: typeof obj.complement === "string" ? obj.complement : null,
    city: typeof obj.city === "string" ? obj.city : null,
    state: typeof obj.state === "string" ? obj.state : null,
  };
}
