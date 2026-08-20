import { randomUUID } from "crypto";
import { AnswerEntry, Submission } from "@/lib/audit/types";
import { readCollection, writeCollection } from "./jsonStore";

const COLLECTION = "submissions";

export async function listSubmissions(): Promise<Submission[]> {
  const submissions = await readCollection<Submission>(COLLECTION);
  return [...submissions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listSubmissionsForUser(userId: string): Promise<Submission[]> {
  return (await listSubmissions()).filter((s) => s.filledBy === userId);
}

export async function listSubmissionsForTemplate(templateId: string): Promise<Submission[]> {
  return (await listSubmissions()).filter((s) => s.templateId === templateId);
}

export async function getSubmission(id: string): Promise<Submission | null> {
  return (await listSubmissions()).find((s) => s.id === id) ?? null;
}

export interface SubmissionInput {
  templateId: string;
  templateTitle: string;
  site: string;
  answers: AnswerEntry[];
}

export async function createSubmission(
  input: SubmissionInput,
  author: { id: string; name: string }
): Promise<Submission> {
  const submissions = await readCollection<Submission>(COLLECTION);
  const now = new Date().toISOString();
  const submission: Submission = {
    id: randomUUID(),
    templateId: input.templateId,
    templateTitle: input.templateTitle,
    site: input.site,
    filledBy: author.id,
    filledByName: author.name,
    status: "SUBMITTED",
    answers: input.answers,
    createdAt: now,
    submittedAt: now,
  };
  await writeCollection(COLLECTION, [...submissions, submission]);
  return submission;
}
