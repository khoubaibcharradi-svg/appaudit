export type QuestionType = "SCALE" | "YES_NO" | "TEXT" | "NUMBER";

export const SCALE_OPTIONS = [
  { value: "always", label: "Toujours", score: 1 },
  { value: "often", label: "Souvent", score: 0.75 },
  { value: "sometimes", label: "Parfois", score: 0.5 },
  { value: "rarely", label: "Rarement", score: 0.25 },
  { value: "never", label: "Jamais", score: 0 },
] as const;

export const YES_NO_OPTIONS = [
  { value: "yes", label: "Oui" },
  { value: "no", label: "Non" },
] as const;

export function optionsForType(type: QuestionType): { value: string; label: string }[] | null {
  if (type === "SCALE") return SCALE_OPTIONS.map(({ value, label }) => ({ value, label }));
  if (type === "YES_NO") return YES_NO_OPTIONS.map(({ value, label }) => ({ value, label }));
  return null;
}

export interface DependsOn {
  questionId: string;
  /** The question becomes visible once the parent's answer is one of these values. */
  triggerValues: string[];
}

export interface QuestionDef {
  id: string;
  text: string;
  type: QuestionType;
  weight: 1 | 2 | 3;
  required: boolean;
  dependsOn?: DependsOn;
}

export interface SectionDef {
  id: string;
  label: string;
  questions: QuestionDef[];
}

export interface AuditTemplate {
  id: string;
  title: string;
  description: string;
  sections: SectionDef[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface AnswerEntry {
  questionId: string;
  value: string;
}

export type SubmissionStatus = "DRAFT" | "SUBMITTED";

export interface Submission {
  id: string;
  templateId: string;
  templateTitle: string;
  site: string;
  filledBy: string;
  filledByName: string;
  status: SubmissionStatus;
  answers: AnswerEntry[];
  createdAt: string;
  submittedAt?: string;
}

export const KNOWN_SITES = ["Usine S2I", "Dépôt Jendouba", "Dépôt Sfax", "Dépôt Sousse"];

export type MissionStatus = "PLANIFIEE" | "TERMINEE";

export interface AuditMission {
  id: string;
  templateId: string;
  templateTitle: string;
  site: string;
  /** ISO date (YYYY-MM-DD) — when the audit is scheduled to take place. */
  scheduledDate: string;
  assignedTo: string;
  assignedToName: string;
  createdBy: string;
  createdByName: string;
  status: MissionStatus;
  submissionId?: string;
  createdAt: string;
}
