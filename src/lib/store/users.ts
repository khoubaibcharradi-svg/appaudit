import { randomUUID } from "crypto";
import type { RowDataPacket } from "mysql2/promise";
import { hashPassword } from "@/lib/auth/password";
import type { User } from "@/lib/auth/types";
import pool, { ensureSchema } from "@/lib/db/pool";
import { logger } from "@/lib/logger";

interface UserRow extends RowDataPacket {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: User["role"];
  created_at: string;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
  };
}

async function insertUser(user: User): Promise<void> {
  await pool.query(
    "INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    [user.id, user.name, user.email, user.passwordHash, user.role, user.createdAt]
  );
}

async function seedIfEmpty(): Promise<void> {
  const [rows] = await pool.query<UserRow[]>("SELECT id FROM users LIMIT 1");
  if (rows.length > 0) return;

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@s2i.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
  const staffEmail = process.env.SEED_STAFF_EMAIL ?? "auditeur@s2i.local";
  const staffPassword = process.env.SEED_STAFF_PASSWORD ?? "Personnel123!";
  const now = new Date().toISOString();

  const seeded: User[] = [
    {
      id: randomUUID(),
      name: "Administrateur Audit",
      email: adminEmail,
      passwordHash: await hashPassword(adminPassword),
      role: "SUPERADMIN",
      createdAt: now,
    },
    {
      id: randomUUID(),
      name: "Auditeur Terrain",
      email: staffEmail,
      passwordHash: await hashPassword(staffPassword),
      role: "PERSONNEL",
      createdAt: now,
    },
  ];
  for (const user of seeded) await insertUser(user);

  logger.info("users.seeded", { admin: adminEmail, personnel: staffEmail });
  console.log(
    `[seed] Comptes créés — superadmin: ${adminEmail} / ${adminPassword} · personnel: ${staffEmail} / ${staffPassword}`
  );
}

export async function listUsers(): Promise<User[]> {
  await ensureSchema();
  await seedIfEmpty();
  const [rows] = await pool.query<UserRow[]>("SELECT * FROM users ORDER BY created_at ASC");
  return rows.map(mapUser);
}

export async function findUserByEmail(email: string): Promise<User | null> {
  await ensureSchema();
  await seedIfEmpty();
  const [rows] = await pool.query<UserRow[]>("SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1", [email]);
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function findUserById(id: string): Promise<User | null> {
  await ensureSchema();
  const [rows] = await pool.query<UserRow[]>("SELECT * FROM users WHERE id = ? LIMIT 1", [id]);
  return rows[0] ? mapUser(rows[0]) : null;
}

/** Used to attribute system-seeded content (e.g. the standard templates) to a real account. */
export async function findAnySuperAdmin(): Promise<User | null> {
  await ensureSchema();
  await seedIfEmpty();
  const [rows] = await pool.query<UserRow[]>("SELECT * FROM users WHERE role = 'SUPERADMIN' LIMIT 1");
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: User["role"];
}): Promise<User> {
  await ensureSchema();
  const [existing] = await pool.query<UserRow[]>("SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1", [
    input.email,
  ]);
  if (existing.length > 0) {
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
  await insertUser(user);
  logger.info("users.created", { id: user.id, email: user.email, role: user.role });
  return user;
}
