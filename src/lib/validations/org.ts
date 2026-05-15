import { z } from "zod";

/** Setor — filho de um departamento */
export const sectorSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  parent_id: z.string().uuid("Departamento obrigatório"),
});

/** Departamento — nível superior (sem pai) */
export const departmentSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  responsible_name: z.string().optional().nullable(),
  responsible_id: z.string().uuid().optional().nullable(),
});

export const updateDepartmentSchema = departmentSchema.partial().extend({
  id: z.string().uuid(),
});

export const updateSectorSchema = sectorSchema.partial().extend({
  id: z.string().uuid(),
});

export const positionSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  department_id: z.string().uuid("Setor obrigatório"),
});

export const updatePositionSchema = positionSchema.partial().extend({
  id: z.string().uuid(),
});

export const deleteDepartmentSchema = z.object({
  id: z.string().uuid(),
});
