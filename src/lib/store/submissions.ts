import { randomUUID } from "crypto";
import type { RowDataPacket } from "mysql2/promise";
import { AnswerEntry, Submission } from "@/lib/audit/types";
import pool, { ensureSchema } from "@/lib/db/pool";
import { logger } from "@/lib/logger";

interface SubmissionRow extends RowDataPacket {
  id: string;
  template_id: string;
  template_title: string;
  site: string;
  filled_by: string;
  filled_by_name: string;
  status: Submission["status"];
  answers: AnswerEntry[] | string;
  created_at: string;
  submitted_at: string | null;
}

function parseAnswers(value: AnswerEntry[] | string): AnswerEntry[] {
  return typeof value === "string" ? JSON.parse(value) : value;
}

function mapSubmission(row: SubmissionRow): Submission {
  return {
    id: row.id,
    templateId: row.template_id,
    templateTitle: row.template_title,
    site: row.site,
    filledBy: row.filled_by,
    filledByName: row.filled_by_name,
    status: row.status,
    answers: parseAnswers(row.answers),
    createdAt: row.created_at,
    submittedAt: row.submitted_at ?? undefined,
  };
}

export async function listSubmissions(): Promise<Submission[]> {
  await ensureSchema();
  const [rows] = await pool.query<SubmissionRow[]>("SELECT * FROM submissions ORDER BY created_at DESC");
  return rows.map(mapSubmission);
}

export async function listSubmissionsForUser(userEmail: string): Promise<Submission[]> {
  await ensureSchema();
  const [rows] = await pool.query<SubmissionRow[]>(
    "SELECT * FROM submissions WHERE filled_by = ? ORDER BY created_at DESC",
    [userEmail]
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
  site: string;
  answers: AnswerEntry[];
}

export async function createSubmission(
  input: SubmissionInput,
  author: { email: string; name: string }
): Promise<Submission> {
  await ensureSchema();
  const now = new Date().toISOString();
  const submission: Submission = {
    id: randomUUID(),
    templateId: input.templateId,
    templateTitle: input.templateTitle,
    site: input.site,
    filledBy: author.email,
    filledByName: author.name,
    status: "SUBMITTED",
    answers: input.answers,
    createdAt: now,
    submittedAt: now,
  };
  await pool.query(
    `INSERT INTO submissions
       (id, template_id, template_title, site, filled_by, filled_by_name, status, answers, created_at, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      submission.id,
      submission.templateId,
      submission.templateTitle,
      submission.site,
      submission.filledBy,
      submission.filledByName,
      submission.status,
      JSON.stringify(submission.answers),
      submission.createdAt,
      submission.submittedAt,
    ]
  );
  logger.info("submissions.created", {
    id: submission.id,
    templateId: submission.templateId,
    site: submission.site,
    by: author.email,
  });
  return submission;
}
