export type Role = "SUPERADMIN" | "ADMIN" | "PERSONNEL";

export function isAdminRole(role: Role): boolean {
  return role === "ADMIN" || role === "SUPERADMIN";
}

export interface User {
  codeUser: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export const ROLE_CODE_PREFIX: Record<Role, string> = {
  SUPERADMIN: "SUP",
  ADMIN: "ADM",
  PERSONNEL: "PER",
};

/** Matches PREFIX-0000 for the given role, e.g. "ADM-0001". */
export function isValidCodeUser(code: string, role: Role): boolean {
  return new RegExp(`^${ROLE_CODE_PREFIX[role]}-\\d{4}$`).test(code);
}
