import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export const passwordSchema = z
  .object({
    password: z
      .string()
      .min(12, "Mínimo 12 caracteres")
      .regex(/[A-Z]/, "Inclua letra maiúscula")
      .regex(/[a-z]/, "Inclua letra minúscula")
      .regex(/[0-9]/, "Inclua número")
      .regex(/[^A-Za-z0-9]/, "Inclua caractere especial"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordInput = z.infer<typeof passwordSchema>;
