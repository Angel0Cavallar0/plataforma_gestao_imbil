"use server";

import { requireAuth } from "@/lib/auth/session";
import { canManageOrgStructure, canViewOrgStructure } from "@/lib/auth/permissions";
import { logAction } from "@/lib/auth/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  deleteDepartmentSchema,
  departmentSchema,
  positionSchema,
  sectorSchema,
  updateDepartmentSchema,
  updatePositionSchema,
  updateSectorSchema,
} from "@/lib/validations/org";
import { revalidatePath } from "next/cache";

const ORG_PATH = "/configuracoes/estrutura";
const USERS_PATH = "/configuracoes/usuarios";

function revalidateOrg() {
  revalidatePath(ORG_PATH);
  revalidatePath(USERS_PATH);
}

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (value === null || value === "") return null;
  return String(value);
}

export interface OrgPositionRow {
  id: string;
  name: string;
  department_id: string | null;
}

/** Setor (filho de departamento) */
export interface OrgSectorRow {
  id: string;
  name: string;
  parent_id: string;
  member_count: number;
  positions: OrgPositionRow[];
}

/** Departamento (nível superior) */
export interface OrgDepartmentRow {
  id: string;
  name: string;
  responsible_name: string | null;
  responsible_id: string | null;
  sectors: OrgSectorRow[];
}

export interface DepartmentMemberRow {
  id: string;
  full_name: string;
  email: string;
  status: string;
  position_name: string | null;
  manager_name: string | null;
}

export interface DepartmentDetailData {
  id: string;
  name: string;
  parent_id: string | null;
  parent_name: string | null;
  responsible_name: string | null;
  responsible_id: string | null;
  responsible_profile_name: string | null;
  positions: OrgPositionRow[];
  members: DepartmentMemberRow[];
}

export interface ManagerCandidate {
  id: string;
  full_name: string;
}

export async function getOrgStructureAction(): Promise<{
  data?: OrgDepartmentRow[];
  error?: string;
}> {
  const session = await requireAuth();
  if (!canViewOrgStructure(session.profile)) {
    return { error: "Sem permissão." };
  }

  const supabase = await createClient();

  const [{ data: departments }, { data: positions }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("departments")
        .select("id, name, parent_id, responsible_name, responsible_id")
        .order("name"),
      supabase.from("positions").select("id, name, department_id").order("name"),
      supabase.from("profiles").select("department_id"),
    ]);

  const memberCountByDept = new Map<string, number>();
  profiles?.forEach((p) => {
    if (p.department_id) {
      memberCountByDept.set(
        p.department_id,
        (memberCountByDept.get(p.department_id) ?? 0) + 1,
      );
    }
  });

  const positionsByDept = new Map<string, OrgPositionRow[]>();
  positions?.forEach((pos) => {
    if (!pos.department_id) return;
    const list = positionsByDept.get(pos.department_id) ?? [];
    list.push(pos);
    positionsByDept.set(pos.department_id, list);
  });

  const topDepartments: OrgDepartmentRow[] = [];
  const sectorsByParent = new Map<string, OrgSectorRow[]>();

  departments?.forEach((d) => {
    if (d.parent_id) {
      const sector: OrgSectorRow = {
        id: d.id,
        name: d.name,
        parent_id: d.parent_id,
        member_count: memberCountByDept.get(d.id) ?? 0,
        positions: positionsByDept.get(d.id) ?? [],
      };
      const list = sectorsByParent.get(d.parent_id) ?? [];
      list.push(sector);
      sectorsByParent.set(d.parent_id, list);
    } else {
      topDepartments.push({
        id: d.id,
        name: d.name,
        responsible_name: d.responsible_name,
        responsible_id: d.responsible_id,
        sectors: [],
      });
    }
  });

  topDepartments.forEach((dept) => {
    dept.sectors = sectorsByParent.get(dept.id) ?? [];
  });

  return { data: topDepartments };
}

export async function getDepartmentDetailAction(
  departmentId: string,
): Promise<{ data?: DepartmentDetailData; error?: string }> {
  const session = await requireAuth();
  if (!canViewOrgStructure(session.profile)) {
    return { error: "Sem permissão." };
  }

  const supabase = await createClient();

  const { data: department, error } = await supabase
    .from("departments")
    .select(
      `
      id, name, parent_id, responsible_name, responsible_id,
      parent:departments!departments_parent_id_fkey(name),
      responsible:profiles!departments_responsible_id_fkey(full_name)
    `,
    )
    .eq("id", departmentId)
    .single();

  if (error || !department) {
    return { error: "Departamento não encontrado." };
  }

  const isDepartamento = department.parent_id === null;

  let positions: OrgPositionRow[] = [];
  let members: {
    id: string;
    full_name: string;
    email: string;
    status: string;
    positions: unknown;
    manager: unknown;
  }[] = [];

  if (isDepartamento) {
    const { data: childSectors } = await supabase
      .from("departments")
      .select("id")
      .eq("parent_id", departmentId);

    const sectorIds = childSectors?.map((s) => s.id) ?? [];

    if (sectorIds.length > 0) {
      const { data: memberRows } = await supabase
        .from("profiles")
        .select(
          `
          id, full_name, email, status,
          positions(name),
          manager:profiles!profiles_manager_id_fkey(full_name)
        `,
        )
        .in("department_id", sectorIds)
        .order("full_name");
      members = memberRows ?? [];
    }
  } else {
    const [{ data: positionRows }, { data: memberRows }] = await Promise.all([
      supabase
        .from("positions")
        .select("id, name, department_id")
        .eq("department_id", departmentId)
        .order("name"),
      supabase
        .from("profiles")
        .select(
          `
          id, full_name, email, status,
          positions(name),
          manager:profiles!profiles_manager_id_fkey(full_name)
        `,
        )
        .eq("department_id", departmentId)
        .order("full_name"),
    ]);
    positions = positionRows ?? [];
    members = memberRows ?? [];
  }

  const parentRaw = department.parent as { name: string } | { name: string }[] | null;
  const parent = Array.isArray(parentRaw) ? parentRaw[0] : parentRaw;

  const responsibleRaw = department.responsible as
    | { full_name: string }
    | { full_name: string }[]
    | null;
  const responsible = Array.isArray(responsibleRaw) ? responsibleRaw[0] : responsibleRaw;

  const memberRows: DepartmentMemberRow[] =
    members?.map((m) => {
      const posRaw = m.positions as { name: string } | { name: string }[] | null;
      const pos = Array.isArray(posRaw) ? posRaw[0] : posRaw;
      const mgrRaw = m.manager as { full_name: string } | { full_name: string }[] | null;
      const mgr = Array.isArray(mgrRaw) ? mgrRaw[0] : mgrRaw;
      return {
        id: m.id,
        full_name: m.full_name,
        email: m.email,
        status: m.status,
        position_name: pos?.name ?? null,
        manager_name: mgr?.full_name ?? null,
      };
    }) ?? [];

  return {
    data: {
      id: department.id,
      name: department.name,
      parent_id: department.parent_id,
      parent_name: parent?.name ?? null,
      responsible_name: department.responsible_name,
      responsible_id: department.responsible_id,
      responsible_profile_name: responsible?.full_name ?? null,
      positions: positions ?? [],
      members: memberRows,
    },
  };
}

export async function getManagerCandidatesAction(): Promise<{
  data?: ManagerCandidate[];
  error?: string;
}> {
  const session = await requireAuth();
  if (!canViewOrgStructure(session.profile)) {
    return { error: "Sem permissão." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("status", "ativo")
    .order("full_name");

  if (error) return { error: error.message };
  return { data: data ?? [] };
}

export async function createDepartmentAction(formData: FormData) {
  const session = await requireAuth();
  if (!canManageOrgStructure(session.profile)) {
    return { error: "Sem permissão." };
  }

  const parsed = departmentSchema.safeParse({
    name: formData.get("name"),
    responsible_name: emptyToNull(formData.get("responsible_name")),
    responsible_id: emptyToNull(formData.get("responsible_id")),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("departments")
    .insert({
      name: parsed.data.name,
      parent_id: null,
      responsible_name: parsed.data.responsible_name ?? null,
      responsible_id: parsed.data.responsible_id ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAction({
    userId: session.profile.id,
    action: "department.created",
    resourceType: "department",
    resourceId: data.id,
    metadata: { type: "department", name: parsed.data.name },
  });

  revalidateOrg();
  return { success: true, id: data.id };
}

export async function updateDepartmentAction(formData: FormData) {
  const session = await requireAuth();
  if (!canManageOrgStructure(session.profile)) {
    return { error: "Sem permissão." };
  }

  const parsed = updateDepartmentSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    responsible_name: emptyToNull(formData.get("responsible_name")),
    responsible_id: emptyToNull(formData.get("responsible_id")),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { id, name, responsible_name, responsible_id } = parsed.data;
  const admin = createAdminClient();
  const { error } = await admin
    .from("departments")
    .update({ name, responsible_name, responsible_id })
    .eq("id", id)
    .is("parent_id", null);

  if (error) return { error: error.message };

  await logAction({
    userId: session.profile.id,
    action: "department.updated",
    resourceType: "department",
    resourceId: id,
    metadata: { type: "department", name, responsible_name, responsible_id },
  });

  revalidateOrg();
  return { success: true };
}

export async function createSectorAction(formData: FormData) {
  const session = await requireAuth();
  if (!canManageOrgStructure(session.profile)) {
    return { error: "Sem permissão." };
  }

  const parsed = sectorSchema.safeParse({
    name: formData.get("name"),
    parent_id: formData.get("parent_id"),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("departments")
    .insert({
      name: parsed.data.name,
      parent_id: parsed.data.parent_id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAction({
    userId: session.profile.id,
    action: "department.created",
    resourceType: "department",
    resourceId: data.id,
    metadata: { type: "sector", name: parsed.data.name },
  });

  revalidateOrg();
  return { success: true, id: data.id };
}

export async function updateSectorAction(formData: FormData) {
  const session = await requireAuth();
  if (!canManageOrgStructure(session.profile)) {
    return { error: "Sem permissão." };
  }

  const parsed = updateSectorSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    parent_id: formData.get("parent_id") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { id, name, parent_id } = parsed.data;
  const admin = createAdminClient();
  const { error } = await admin
    .from("departments")
    .update({ name, parent_id })
    .eq("id", id)
    .not("parent_id", "is", null);

  if (error) return { error: error.message };

  await logAction({
    userId: session.profile.id,
    action: "department.updated",
    resourceType: "department",
    resourceId: id,
    metadata: { type: "sector", name, parent_id },
  });

  revalidateOrg();
  return { success: true };
}

export async function createPositionAction(formData: FormData) {
  const session = await requireAuth();
  if (!canManageOrgStructure(session.profile)) {
    return { error: "Sem permissão." };
  }

  const parsed = positionSchema.safeParse({
    name: formData.get("name"),
    department_id: formData.get("department_id"),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("positions")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAction({
    userId: session.profile.id,
    action: "position.created",
    resourceType: "position",
    resourceId: data.id,
    metadata: parsed.data,
  });

  revalidateOrg();
  return { success: true, id: data.id };
}

export async function updatePositionAction(formData: FormData) {
  const session = await requireAuth();
  if (!canManageOrgStructure(session.profile)) {
    return { error: "Sem permissão." };
  }

  const parsed = updatePositionSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    department_id: formData.get("department_id") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { id, ...updates } = parsed.data;
  const admin = createAdminClient();
  const { error } = await admin.from("positions").update(updates).eq("id", id);

  if (error) return { error: error.message };

  await logAction({
    userId: session.profile.id,
    action: "position.updated",
    resourceType: "position",
    resourceId: id,
    metadata: updates,
  });

  revalidateOrg();
  return { success: true };
}

export async function deletePositionAction(positionId: string) {
  const session = await requireAuth();
  if (!canManageOrgStructure(session.profile)) {
    return { error: "Sem permissão." };
  }

  const admin = createAdminClient();

  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("position_id", positionId);

  if (count && count > 0) {
    return {
      error: "Não é possível excluir: existem colaboradores vinculados a este cargo.",
    };
  }

  const { error } = await admin.from("positions").delete().eq("id", positionId);
  if (error) return { error: error.message };

  await logAction({
    userId: session.profile.id,
    action: "position.deleted",
    resourceType: "position",
    resourceId: positionId,
  });

  revalidateOrg();
  return { success: true };
}

export async function deleteDepartmentAction(formData: FormData) {
  const session = await requireAuth();
  if (!canManageOrgStructure(session.profile)) {
    return { error: "Sem permissão." };
  }

  const parsed = deleteDepartmentSchema.safeParse({
    id: formData.get("id"),
  });
  if (!parsed.success) {
    return { error: "ID inválido." };
  }

  const admin = createAdminClient();
  const id = parsed.data.id;

  const { data: dept } = await admin
    .from("departments")
    .select("parent_id")
    .eq("id", id)
    .single();

  if (!dept) return { error: "Registro não encontrado." };

  const isDepartamento = dept.parent_id === null;

  if (isDepartamento) {
    const { count: childCount } = await admin
      .from("departments")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", id);
    if (childCount && childCount > 0) {
      return {
        error: "Não é possível excluir: o departamento possui setores vinculados.",
      };
    }
  } else {
    const { count: posCount } = await admin
      .from("positions")
      .select("id", { count: "exact", head: true })
      .eq("department_id", id);
    if (posCount && posCount > 0) {
      return {
        error: "Não é possível excluir: o setor possui cargos vinculados.",
      };
    }
  }

  const { count: memberCount } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("department_id", id);

  if (memberCount && memberCount > 0) {
    return {
      error: "Não é possível excluir: existem colaboradores vinculados.",
    };
  }

  const { error } = await admin.from("departments").delete().eq("id", id);
  if (error) return { error: error.message };

  await logAction({
    userId: session.profile.id,
    action: "department.deleted",
    resourceType: "department",
    resourceId: id,
    metadata: { type: isDepartamento ? "department" : "sector" },
  });

  revalidateOrg();
  return { success: true };
}
