import { randomUUID } from "crypto";
import type { RowDataPacket } from "mysql2/promise";
import { AnswerEntry, InventoryCount, Submission } from "@/lib/audit/types";
import pool, { ensureSchema } from "@/lib/db/pool";
import { logger } from "@/lib/logger";

interface SubmissionRow extends RowDataPacket {
  id: string;
  template_id: string;
  template_title: string;
  site_code: string;
  site: string;
  filled_by: string;
  filled_by_name: string;
  status: Submission["status"];
  answers: AnswerEntry[] | string;
  inventory_counts: InventoryCount[] | string | null;
  created_at: string;
  submitted_at: string | null;
}

function parseJsonColumn<T>(value: T | string | null): T | undefined {
  if (value === null) return undefined;
  return typeof value === "string" ? JSON.parse(value) : value;
}

function mapSubmission(row: SubmissionRow): Submission {
  return {
    id: row.id,
    templateId: row.template_id,
    templateTitle: row.template_title,
    siteCode: row.site_code,
    site: row.site,
    filledBy: row.filled_by,
    filledByName: row.filled_by_name,
    status: row.status,
    answers: parseJsonColumn<AnswerEntry[]>(row.answers) ?? [],
    inventoryCounts: parseJsonColumn<InventoryCount[]>(row.inventory_counts),
    createdAt: row.created_at,
    submittedAt: row.submitted_at ?? undefined,
  };
}

export async function listSubmissions(): Promise<Submission[]> {
  await ensureSchema();
  const [rows] = await pool.query<SubmissionRow[]>("SELECT * FROM submissions ORDER BY created_at DESC");
  return rows.map(mapSubmission);
}

export async function listSubmissionsForUser(userCode: string): Promise<Submission[]> {
  await ensureSchema();
  const [rows] = await pool.query<SubmissionRow[]>(
    "SELECT * FROM submissions WHERE filled_by = ? ORDER BY created_at DESC",
    [userCode]
  );
  return rows.map(mapSubmission);
}

export async function listSubmissionsForTemplate(templateId: string): Promise<Submission[]> {
  await ensureSchema();
  const [rows] = await pool.query<SubmissionRow[]>(
    "SELECT * FROM submissions WHERE template_id = ? ORDER BY created_at DESC",
    [templateId]
  );
  return rows.map(mapSubmission);
}

export async function getSubmission(id: string): Promise<Submission | null> {
  await ensureSchema();
  const [rows] = await pool.query<SubmissionRow[]>("SELECT * FROM submissions WHERE id = ? LIMIT 1", [id]);
  return rows[0] ? mapSubmission(rows[0]) : null;
}

export interface SubmissionInput {
  templateId: string;
  templateTitle: string;
  siteCode: string;
  site: string;
  answers: AnswerEntry[];
  inventoryCounts?: InventoryCount[];
}

export async function createSubmission(
  input: SubmissionInput,
  author: { codeUser: string; name: string }
): Promise<Submission> {
  await ensureSchema();
  const now = new Date().toISOString();
  const submission: Submission = {
    id: randomUUID(),
    templateId: input.templateId,
    templateTitle: input.templateTitle,
    siteCode: input.siteCode,
    site: input.site,
    filledBy: author.codeUser,
    filledByName: author.name,
    status: "SUBMITTED",
    answers: input.answers,
    inventoryCounts: input.inventoryCounts,
    createdAt: now,
    submittedAt: now,
  };
  await pool.query(
    `INSERT INTO submissions
       (id, template_id, template_title, site_code, site, filled_by, filled_by_name, status, answers, inventory_counts, created_at, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      submission.id,
      submission.templateId,
      submission.templateTitle,
      submission.siteCode,
      submission.site,
      submission.filledBy,
      submission.filledByName,
      submission.status,
      JSON.stringify(submission.answers),
      submission.inventoryCounts ? JSON.stringify(submission.inventoryCounts) : null,
      submission.createdAt,
      submission.submittedAt,
    ]
  );
  logger.info("submissions.created", {
    id: submission.id,
    templateId: submission.templateId,
    site: submission.site,
    inventory: Boolean(submission.inventoryCounts),
    by: author.codeUser,
  });
  return submission;
}
