export type Role = "SUPERADMIN" | "ADMIN" | "PERSONNEL";

export function isAdminRole(role: Role): boolean {
  return role === "ADMIN" || role === "SUPERADMIN";
}

export interface User {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}
