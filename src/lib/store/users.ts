import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { hashPassword } from "@/lib/auth/password";
import { ROLE_CODE_PREFIX, type User } from "@/lib/auth/types";
import pool, { ensureSchema } from "@/lib/db/pool";
import { logger } from "@/lib/logger";

interface UserRow extends RowDataPacket {
  code_user: string;
  email: string;
  name: string;
  password_hash: string;
  role: User["role"];
  is_active: number;
  created_at: string;
}

function mapUser(row: UserRow): User {
  return {
    codeUser: row.code_user,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  };
}

async function insertUser(user: User, ignoreDuplicates = false): Promise<void> {
  await pool.query(
    `INSERT ${ignoreDuplicates ? "IGNORE " : ""}INTO users (code_user, email, name, password_hash, role, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [user.codeUser, user.email, user.name, user.passwordHash, user.role, user.isActive ? 1 : 0, user.createdAt]
  );
}

async function seedIfEmpty(): Promise<void> {
  const [rows] = await pool.query<UserRow[]>("SELECT code_user FROM users LIMIT 1");
  if (rows.length > 0) return;

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@s2i.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
  const staffEmail = process.env.SEED_STAFF_EMAIL ?? "auditeur@s2i.local";
  const staffPassword = process.env.SEED_STAFF_PASSWORD ?? "Personnel123!";
  const now = new Date().toISOString();

  const seeded: User[] = [
    {
      codeUser: "SUP-0001",
      name: "Administrateur Audit",
      email: adminEmail,
      passwordHash: await hashPassword(adminPassword),
      role: "SUPERADMIN",
      isActive: true,
      createdAt: now,
    },
    {
      codeUser: "PER-0001",
      name: "Auditeur Terrain",
      email: staffEmail,
      passwordHash: await hashPassword(staffPassword),
      role: "PERSONNEL",
      isActive: true,
      createdAt: now,
    },
  ];
  for (const user of seeded) await insertUser(user, true);

  logger.info("users.seeded", { admin: adminEmail, personnel: staffEmail });
  console.log(
    `[seed] Comptes créés — superadmin: ${adminEmail} / ${adminPassword} (${seeded[0].codeUser}) · personnel: ${staffEmail} / ${staffPassword} (${seeded[1].codeUser})`
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

export async function findUserByCode(codeUser: string): Promise<User | null> {
  await ensureSchema();
  await seedIfEmpty();
  const [rows] = await pool.query<UserRow[]>("SELECT * FROM users WHERE code_user = ? LIMIT 1", [codeUser]);
  return rows[0] ? mapUser(rows[0]) : null;
}

/** Used to attribute system-seeded content (e.g. the standard templates) to a real account. */
export async function findAnySuperAdmin(): Promise<User | null> {
  await ensureSchema();
  await seedIfEmpty();
  const [rows] = await pool.query<UserRow[]>("SELECT * FROM users WHERE role = 'SUPERADMIN' LIMIT 1");
  return rows[0] ? mapUser(rows[0]) : null;
}

/** Next unused sequential code for a role's prefix (e.g. "ADM-0003"), suggested as a default in the creation form. */
export async function suggestNextCode(role: User["role"]): Promise<string> {
  await ensureSchema();
  const prefix = ROLE_CODE_PREFIX[role];
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT code_user FROM users WHERE code_user LIKE ? ORDER BY code_user DESC LIMIT 1",
    [`${prefix}-%`]
  );
  const last = rows[0]?.code_user as string | undefined;
  const lastNumber = last ? parseInt(last.slice(prefix.length + 1), 10) : 0;
  const next = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;
  return `${prefix}-${String(next).padStart(4, "0")}`;
}

export async function createUser(input: {
  codeUser: string;
  name: string;
  email: string;
  password: string;
  role: User["role"];
}): Promise<User> {
  await ensureSchema();
  const [existingEmail] = await pool.query<UserRow[]>(
    "SELECT code_user FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
    [input.email]
  );
  if (existingEmail.length > 0) {
    throw new Error("Un utilisateur avec cet email existe déjà.");
  }
  const [existingCode] = await pool.query<UserRow[]>("SELECT code_user FROM users WHERE code_user = ? LIMIT 1", [
    input.codeUser,
  ]);
  if (existingCode.length > 0) {
    throw new Error("Ce matricule est déjà utilisé.");
  }

  const user: User = {
    codeUser: input.codeUser,
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    role: input.role,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  await insertUser(user);
  logger.info("users.created", { codeUser: user.codeUser, email: user.email, role: user.role });
  return user;
}

export async function setUserActive(email: string, isActive: boolean): Promise<User | null> {
  await ensureSchema();
  const [result] = await pool.query<ResultSetHeader>("UPDATE users SET is_active = ? WHERE LOWER(email) = LOWER(?)", [
    isActive ? 1 : 0,
    email,
  ]);
  if (result.affectedRows === 0) return null;
  logger.info(isActive ? "users.activated" : "users.deactivated", { email });
  return findUserByEmail(email);
}
