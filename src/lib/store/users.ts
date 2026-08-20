import { randomUUID } from "crypto";
import { hashPassword } from "@/lib/auth/password";
import type { User } from "@/lib/auth/types";
import { readCollection, writeCollection } from "./jsonStore";

const COLLECTION = "users";

async function seedIfEmpty(users: User[]): Promise<User[]> {
  if (users.length > 0) return users;

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@s2i.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
  const staffEmail = process.env.SEED_STAFF_EMAIL ?? "auditeur@s2i.local";
  const staffPassword = process.env.SEED_STAFF_PASSWORD ?? "Personnel123!";

  const seeded: User[] = [
    {
      id: randomUUID(),
      name: "Administrateur Audit",
      email: adminEmail,
      passwordHash: await hashPassword(adminPassword),
      role: "ADMIN",
      createdAt: new Date().toISOString(),
    },
    {
      id: randomUUID(),
      name: "Auditeur Terrain",
      email: staffEmail,
      passwordHash: await hashPassword(staffPassword),
      role: "PERSONNEL",
      createdAt: new Date().toISOString(),
    },
  ];
  await writeCollection(COLLECTION, seeded);
  console.log(
    `[seed] Comptes créés — admin: ${adminEmail} / ${adminPassword} · personnel: ${staffEmail} / ${staffPassword}`
  );
  return seeded;
}

export async function listUsers(): Promise<User[]> {
  const users = await readCollection<User>(COLLECTION);
  return seedIfEmpty(users);
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const users = await listUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
  const users = await listUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: User["role"];
}): Promise<User> {
  const users = await listUsers();
  if (users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error("Un utilisateur avec cet email existe déjà.");
  }
  const user: User = {
    id: randomUUID(),
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    role: input.role,
    createdAt: new Date().toISOString(),
  };
  await writeCollection(COLLECTION, [...users, user]);
  return user;
}
