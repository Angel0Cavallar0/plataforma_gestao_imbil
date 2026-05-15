"use client";

import { useRef, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { uploadAvatarAction, updateMyProfileAction } from "@/server/actions/profile";
import { ProfileAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  AVATAR_ALLOWED_TYPES,
  AVATAR_MAX_BYTES,
  LANGUAGES,
  THEME_PREFERENCES,
} from "@/lib/constants";
import { normalizeBrazilPhoneDisplay } from "@/lib/utils/phone";
import type { AddressInput } from "@/lib/validations/profile";
import type { ThemePreference } from "@/lib/constants";

export interface ProfileFormData {
  phone: string | null;
  whatsapp: string | null;
  birth_date: string | null;
  avatar_url: string | null;
  address: AddressInput | null;
  theme_preference: string;
  language: string;
}

interface EditProfileFormProps {
  fullName: string;
  initial: ProfileFormData;
}

interface FormState {
  phone: string;
  whatsapp: string;
  birth_date: string;
  address_cep: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_city: string;
  address_state: string;
  theme_preference: string;
  language: string;
}

const THEME_LABELS: Record<(typeof THEME_PREFERENCES)[number], string> = {
  light: "Claro",
  dark: "Escuro",
  system: "Sistema",
};

function toFormState(data: ProfileFormData): FormState {
  const address = data.address ?? {};
  return {
    phone: normalizeBrazilPhoneDisplay(data.phone),
    whatsapp: normalizeBrazilPhoneDisplay(data.whatsapp),
    birth_date: data.birth_date ?? "",
    address_cep: address.cep ?? "",
    address_street: address.street ?? "",
    address_number: address.number ?? "",
    address_complement: address.complement ?? "",
    address_city: address.city ?? "",
    address_state: address.state ?? "",
    theme_preference: data.theme_preference,
    language: data.language,
  };
}

function buildFormData(form: FormState): FormData {
  const fd = new FormData();
  fd.set("phone", form.phone);
  fd.set("whatsapp", form.whatsapp);
  fd.set("birth_date", form.birth_date);
  fd.set("address_cep", form.address_cep);
  fd.set("address_street", form.address_street);
  fd.set("address_number", form.address_number);
  fd.set("address_complement", form.address_complement);
  fd.set("address_city", form.address_city);
  fd.set("address_state", form.address_state);
  fd.set("theme_preference", form.theme_preference);
  fd.set("language", form.language);
  return fd;
}

export function EditProfileForm({ fullName, initial }: EditProfileFormProps) {
  const { setTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(initial);
  const [savedAvatarUrl, setSavedAvatarUrl] = useState(initial.avatar_url);
  const [form, setForm] = useState(() => toFormState(initial));
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleDiscard() {
    setForm(toFormState(saved));
    setAvatarUrl(savedAvatarUrl);
    setError(null);
    toast.message("Alterações descartadas.");
  }

  async function handleAvatarChange(file: File) {
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error("Arquivo muito grande. O limite é 10 MB.");
      return;
    }
    if (
      !AVATAR_ALLOWED_TYPES.includes(file.type as (typeof AVATAR_ALLOWED_TYPES)[number])
    ) {
      toast.error("Formato inválido. Use JPEG, PNG ou WebP.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarUrl(previewUrl);
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set("avatar", file);
    const result = await uploadAvatarAction(formData);
    URL.revokeObjectURL(previewUrl);
    setUploading(false);

    if (result.error) {
      setAvatarUrl(savedAvatarUrl);
      setError(result.error);
      toast.error(result.error);
      return;
    }

    if (result.avatarUrl) {
      setAvatarUrl(result.avatarUrl);
      setSavedAvatarUrl(result.avatarUrl);
      toast.success("Foto atualizada.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const result = await updateMyProfileAction(buildFormData(form));
    setSaving(false);

    if (result.error) {
      const msg =
        typeof result.error === "string"
          ? result.error
          : "Verifique os campos do formulário.";
      setError(msg);
      toast.error(msg);
      return;
    }

    const theme = form.theme_preference as ThemePreference;
    if (theme === "system") setTheme("system");
    else setTheme(theme);

    const nextSaved: ProfileFormData = {
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      birth_date: form.birth_date || null,
      avatar_url: avatarUrl,
      address: {
        cep: form.address_cep || null,
        street: form.address_street || null,
        number: form.address_number || null,
        complement: form.address_complement || null,
        city: form.address_city || null,
        state: form.address_state || null,
      },
      theme_preference: form.theme_preference,
      language: form.language,
    };
    setSaved(nextSaved);
    toast.success("Perfil atualizado.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seus dados</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Foto de perfil</h3>
            <div className="flex items-center gap-4">
              <ProfileAvatar
                src={avatarUrl}
                name={fullName}
                className="h-16 w-16"
                fallbackClassName="text-lg"
              />
              <div className="space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleAvatarChange(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? "Enviando…" : "Alterar foto"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG ou WebP — máx. 10 MB
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Contato</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="phone">Telefone celular</Label>
                <PhoneInput
                  id="phone"
                  value={form.phone}
                  onChange={(value) => updateField("phone", value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <PhoneInput
                  id="whatsapp"
                  value={form.whatsapp}
                  onChange={(value) => updateField("whatsapp", value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="birth_date">Data de nascimento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={form.birth_date}
                  onChange={(e) => updateField("birth_date", e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Endereço</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="address_cep">CEP</Label>
                <Input
                  id="address_cep"
                  value={form.address_cep}
                  onChange={(e) => updateField("address_cep", e.target.value)}
                  placeholder="00000-000"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="address_street">Rua</Label>
                <Input
                  id="address_street"
                  value={form.address_street}
                  onChange={(e) => updateField("address_street", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address_number">Número</Label>
                <Input
                  id="address_number"
                  value={form.address_number}
                  onChange={(e) => updateField("address_number", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address_complement">Complemento</Label>
                <Input
                  id="address_complement"
                  value={form.address_complement}
                  onChange={(e) => updateField("address_complement", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address_city">Cidade</Label>
                <Input
                  id="address_city"
                  value={form.address_city}
                  onChange={(e) => updateField("address_city", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address_state">UF</Label>
                <Input
                  id="address_state"
                  maxLength={2}
                  value={form.address_state}
                  onChange={(e) => updateField("address_state", e.target.value)}
                  placeholder="SP"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Preferências</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="theme_preference">Tema</Label>
                <select
                  id="theme_preference"
                  value={form.theme_preference}
                  onChange={(e) => updateField("theme_preference", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {THEME_PREFERENCES.map((t) => (
                    <option key={t} value={t}>
                      {THEME_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="language">Idioma</Label>
                <select
                  id="language"
                  value={form.language}
                  onChange={(e) => updateField("language", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      Português (Brasil)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="success" disabled={saving}>
              {saving ? "Salvando…" : "Salvar alterações"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={saving}
              onClick={handleDiscard}
            >
              Descartar alterações
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
