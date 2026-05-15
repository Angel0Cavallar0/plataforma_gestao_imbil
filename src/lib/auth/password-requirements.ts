export type PasswordRequirement = {
  id: string;
  label: string;
  test: (password: string, confirmPassword?: string) => boolean;
};

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: "length",
    label: "Mínimo 12 caracteres",
    test: (password) => password.length >= 12,
  },
  {
    id: "uppercase",
    label: "Uma letra maiúscula",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "lowercase",
    label: "Uma letra minúscula",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "number",
    label: "Um número",
    test: (password) => /[0-9]/.test(password),
  },
  {
    id: "special",
    label: "Um caractere especial",
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

export const PASSWORD_MATCH_REQUIREMENT: PasswordRequirement = {
  id: "match",
  label: "Senhas conferem",
  test: (password, confirmPassword = "") =>
    confirmPassword.length > 0 && password === confirmPassword,
};

export function getPasswordRequirementStatuses(password: string, confirmPassword = "") {
  const rules = [...PASSWORD_REQUIREMENTS, PASSWORD_MATCH_REQUIREMENT];
  return rules.map((rule) => ({
    ...rule,
    met: rule.test(password, confirmPassword),
  }));
}

export function isPasswordValid(password: string, confirmPassword: string): boolean {
  return getPasswordRequirementStatuses(password, confirmPassword).every((r) => r.met);
}
