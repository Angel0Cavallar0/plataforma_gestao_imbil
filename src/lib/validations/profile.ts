import { z } from "zod";
import {
  AVATAR_ALLOWED_TYPES,
  AVATAR_MAX_BYTES,
  LANGUAGES,
  THEME_PREFERENCES,
} from "@/lib/constants";

export const addressSchema = z.object({
  cep: z.string().max(9).optional().nullable(),
  street: z.string().max(200).optional().nullable(),
  number: z.string().max(20).optional().nullable(),
  complement: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(2).optional().nullable(),
});

export const updateMyProfileSchema = z.object({
  phone: z.string().max(20).optional().nullable(),
  whatsapp: z.string().max(20).optional().nullable(),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
    .optional()
    .nullable()
    .or(z.literal("")),
  address: addressSchema.optional().nullable(),
  theme_preference: z.enum(THEME_PREFERENCES).default("system"),
  language: z.enum(LANGUAGES).default("pt-BR"),
});

export const avatarFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= AVATAR_MAX_BYTES, "Arquivo muito grande (máx. 2MB)")
  .refine(
    (file) =>
      AVATAR_ALLOWED_TYPES.includes(file.type as (typeof AVATAR_ALLOWED_TYPES)[number]),
    "Formato inválido. Use JPEG, PNG ou WebP.",
  );

export type UpdateMyProfileInput = z.infer<typeof updateMyProfileSchema>;
export type AddressInput = z.infer<typeof addressSchema>;

export function parseMyProfileFormData(formData: FormData) {
  const addressRaw = {
    cep: emptyToNull(formData.get("address_cep")),
    street: emptyToNull(formData.get("address_street")),
    number: emptyToNull(formData.get("address_number")),
    complement: emptyToNull(formData.get("address_complement")),
    city: emptyToNull(formData.get("address_city")),
    state: emptyToNull(formData.get("address_state")),
  };

  const hasAddress = Object.values(addressRaw).some((v) => v != null);

  return updateMyProfileSchema.safeParse({
    phone: emptyToNull(formData.get("phone")),
    whatsapp: emptyToNull(formData.get("whatsapp")),
    birth_date: emptyToNull(formData.get("birth_date")),
    address: hasAddress ? addressRaw : null,
    theme_preference: formData.get("theme_preference") ?? "system",
    language: formData.get("language") ?? "pt-BR",
  });
}

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (value == null) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}
