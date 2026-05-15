"use client";

import { useRef, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { uploadAvatarAction, updateMyProfileAction } from "@/server/actions/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LANGUAGES, THEME_PREFERENCES } from "@/lib/constants";
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const THEME_LABELS: Record<(typeof THEME_PREFERENCES)[number], string> = {
  light: "Claro",
  dark: "Escuro",
  system: "Sistema",
};

export function EditProfileForm({ fullName, initial }: EditProfileFormProps) {
  const { setTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const address = initial.address ?? {};

  async function handleAvatarChange(file: File) {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.set("avatar", file);
    const result = await uploadAvatarAction(formData);
    setUploading(false);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    if (result.avatarUrl) {
      setAvatarUrl(result.avatarUrl);
      toast.success("Foto atualizada.");
    }
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setError(null);
    const result = await updateMyProfileAction(formData);
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

    const theme = formData.get("theme_preference") as ThemePreference;
    if (theme === "system") setTheme("system");
    else setTheme(theme);

    toast.success("Perfil atualizado.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seus dados</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Foto de perfil</h3>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName} /> : null}
                <AvatarFallback className="text-lg">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
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
                  JPEG, PNG ou WebP — máx. 2 MB
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Contato</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="phone">Telefone celular</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={initial.phone ?? ""}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  defaultValue={initial.whatsapp ?? ""}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="birth_date">Data de nascimento</Label>
                <Input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  defaultValue={initial.birth_date ?? ""}
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
                  name="address_cep"
                  defaultValue={address.cep ?? ""}
                  placeholder="00000-000"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="address_street">Rua</Label>
                <Input
                  id="address_street"
                  name="address_street"
                  defaultValue={address.street ?? ""}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address_number">Número</Label>
                <Input
                  id="address_number"
                  name="address_number"
                  defaultValue={address.number ?? ""}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address_complement">Complemento</Label>
                <Input
                  id="address_complement"
                  name="address_complement"
                  defaultValue={address.complement ?? ""}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address_city">Cidade</Label>
                <Input
                  id="address_city"
                  name="address_city"
                  defaultValue={address.city ?? ""}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address_state">UF</Label>
                <Input
                  id="address_state"
                  name="address_state"
                  maxLength={2}
                  defaultValue={address.state ?? ""}
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
                  name="theme_preference"
                  defaultValue={initial.theme_preference}
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
                  name="language"
                  defaultValue={initial.language}
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

          <Button type="submit" disabled={saving}>
            {saving ? "Salvando…" : "Salvar alterações"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
