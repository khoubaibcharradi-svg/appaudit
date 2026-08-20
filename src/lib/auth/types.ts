export type Role = "ADMIN" | "PERSONNEL";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
}
