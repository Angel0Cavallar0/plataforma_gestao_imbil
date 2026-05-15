import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { parseAddressFromJson } from "@/lib/profile/parse-address";
import { ProfileReadOnlyCard } from "@/components/profile/profile-read-only-card";
import { EditProfileForm } from "@/components/profile/edit-profile-form";

function relationName(
  value: { name: string } | { name: string }[] | null | undefined,
): string | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0]?.name ?? null;
  return value.name;
}

export default async function PerfilPage() {
  const session = await requireAuth();
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      `
      full_name,
      email,
      registration_number,
      phone,
      whatsapp,
      birth_date,
      avatar_url,
      address,
      theme_preference,
      language,
      admission_date,
      roles(name),
      departments(name),
      positions(name),
      manager:profiles!profiles_manager_id_fkey(full_name)
    `,
    )
    .eq("id", session.profile.id)
    .single();

  if (error || !profile) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Meu perfil</h1>
        <p className="text-sm text-destructive">
          Não foi possível carregar seus dados. Tente novamente mais tarde.
        </p>
      </div>
    );
  }

  const manager = profile.manager as
    | { full_name: string }
    | { full_name: string }[]
    | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Meu perfil</h1>
        <p className="text-sm text-muted-foreground">
          Atualize seus dados de contato, endereço e preferências da conta.
        </p>
      </div>

      <ProfileReadOnlyCard
        data={{
          full_name: profile.full_name,
          email: profile.email,
          registration_number: profile.registration_number,
          role_name:
            relationName(profile.roles as { name: string } | { name: string }[]) ??
            session.profile.role_name,
          department_name: relationName(
            profile.departments as { name: string } | { name: string }[],
          ),
          position_name: relationName(
            profile.positions as { name: string } | { name: string }[],
          ),
          manager_name: Array.isArray(manager)
            ? (manager[0]?.full_name ?? null)
            : (manager?.full_name ?? null),
          admission_date: profile.admission_date,
        }}
      />

      <EditProfileForm
        fullName={profile.full_name}
        initial={{
          phone: profile.phone,
          whatsapp: profile.whatsapp,
          birth_date: profile.birth_date,
          avatar_url: profile.avatar_url,
          address: parseAddressFromJson(profile.address),
          theme_preference: profile.theme_preference ?? "system",
          language: profile.language ?? "pt-BR",
        }}
      />
    </div>
  );
}
