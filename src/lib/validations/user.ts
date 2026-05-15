import { z } from "zod";
import { PROFILE_STATUSES, ROLE_SLUGS } from "@/lib/constants";

export const createUserSchema = z.object({
  full_name: z.string().min(3, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  registration_number: z.string().min(1, "Matrícula obrigatória"),
  role_id: z.string().uuid(),
  department_id: z.string().uuid().optional().nullable(),
  position_id: z.string().uuid().optional().nullable(),
  manager_id: z.string().uuid().optional().nullable(),
  admission_date: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  status: z.enum(PROFILE_STATUSES).default("ativo"),
  module_ids: z.array(z.string().uuid()).optional(),
});

export const updateUserSchema = createUserSchema.partial().omit({ email: true }).extend({
  id: z.string().uuid(),
  must_change_password: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const roleSlugSchema = z.enum(ROLE_SLUGS);
