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
  /** Marks a seeded standard template so new ones can be added later without duplicating existing ones. */
  standardKey?: string;
}

export interface AnswerEntry {
  questionId: string;
  value: string;
}

export type SubmissionStatus = "DRAFT" | "SUBMITTED";

export interface InventoryCount {
  productCode: string;
  quantity: number;
}

export interface Submission {
  id: string;
  templateId: string;
  templateTitle: string;
  siteCode: string;
  site: string;
  filledBy: string;
  filledByName: string;
  status: SubmissionStatus;
  answers: AnswerEntry[];
  inventoryCounts?: InventoryCount[];
  createdAt: string;
  submittedAt?: string;
}

export type SiteType = "USINE" | "DEPOT";
export type DepotNature = "FIXE" | "MOBILE";

export interface Site {
  code: string;
  name: string;
  type: SiteType;
  /** Only meaningful for DEPOT — a USINE is always fixed. */
  nature?: DepotNature;
  region?: string;
}

/** PREFIX used to build/validate a site's code (code-USI-0001, DEPF-0001, DEPM-0001). */
export function siteCodePrefix(type: SiteType, nature?: DepotNature): string {
  if (type === "USINE") return "USI";
  return nature === "MOBILE" ? "DEPM" : "DEPF";
}

export function isValidSiteCode(code: string, type: SiteType, nature?: DepotNature): boolean {
  return new RegExp(`^${siteCodePrefix(type, nature)}-\\d{4}$`).test(code);
}

export type MissionStatus = "PLANIFIEE" | "TERMINEE";

export interface AuditMission {
  id: string;
  templateId: string;
  templateTitle: string;
  siteCode: string;
  site: string;
  /** ISO date (YYYY-MM-DD) — when the audit is scheduled to take place. */
  scheduledDate: string;
  assignedTo: string;
  assignedToName: string;
  createdBy: string;
  createdByName: string;
  status: MissionStatus;
  submissionId?: string;
  /** When true, the personnel filling this mission must also record an inventory count. */
  isInventory: boolean;
  createdAt: string;
}

/** The product catalog backing the inventory task — code is the real SAP article code. */
export interface Product {
  code: string;
  designation: string;
  famille?: string;
  /** Units per case/pack. */
  colisage?: number;
  prixAchat?: number;
  prixVente1?: number;
  prixVente2?: number;
  prixVente3?: number;
  prixVente4?: number;
  prixVente5?: number;
  prixVente6?: number;
}
