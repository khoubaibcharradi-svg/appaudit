import { randomUUID } from "crypto";
import {
  buildContainerStandardSections,
  buildDepotStandardSections,
  buildUsineStandardSections,
} from "@/lib/audit/standardTemplate";
import { AuditTemplate, SectionDef } from "@/lib/audit/types";
import { readCollection, writeCollection } from "./jsonStore";
import { findAnySuperAdmin } from "./users";

const COLLECTION = "templates";

interface StandardTemplateDef {
  key: string;
  title: string;
  description: string;
  buildSections: () => SectionDef[];
}

// Adding a new entry here makes it appear automatically for every
// installation (new or existing) — each is only ever created once,
// tracked by `standardKey`, so re-running never duplicates it.
const STANDARD_TEMPLATES: StandardTemplateDef[] = [
  {
    key: "usine",
    title: "Audit industriel — Usine S2I",
    description:
      "Trame standard pour les audits usine : ventes, ordres de fabrication, machines/moules, matières premières, rebuts, recouvrement, RH et sécurité. Dupliquez-le pour créer un nouveau formulaire à partir de cette base.",
    buildSections: buildUsineStandardSections,
  },
  {
    key: "depot",
    title: "Audit logistique et commercial — Dépôt",
    description:
      "Trame standard pour les audits dépôt : inventaire stock, clôture de caisse, facturation/livraison, retours clients, organisation et recouvrement. Dupliquez-le pour créer un nouveau formulaire à partir de cette base.",
    buildSections: buildDepotStandardSections,
  },
  {
    key: "container",
    title: "Audit logistique — Déchargement de containers importés",
    description:
      "Grille de contrôle standard pour le déchargement des containers importés : contrôle documentaire avant ouverture, inspection de l'état général, comptage contradictoire et DLC, procédure en cas de non-conformité. Dupliquez-le pour créer un nouveau formulaire à partir de cette base.",
    buildSections: buildContainerStandardSections,
  },
];

function buildStandardTemplate(def: StandardTemplateDef, creator: { id: string; name: string }): AuditTemplate {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    title: def.title,
    description: def.description,
    sections: def.buildSections(),
    isActive: false,
    createdBy: creator.id,
    createdByName: creator.name,
    createdAt: now,
    updatedAt: now,
    standardKey: def.key,
  };
}

async function ensureStandardTemplates(templates: AuditTemplate[]): Promise<AuditTemplate[]> {
  const existingKeys = new Set(templates.map((t) => t.standardKey).filter(Boolean));
  const missing = STANDARD_TEMPLATES.filter((def) => !existingKeys.has(def.key));
  if (missing.length === 0) return templates;

  const creator = await findAnySuperAdmin();
  if (!creator) return templates;

  const added = missing.map((def) => buildStandardTemplate(def, creator));
  const next = [...templates, ...added];
  await writeCollection(COLLECTION, next);
  return next;
}

export async function listTemplates(): Promise<AuditTemplate[]> {
  const templates = await readCollection<AuditTemplate>(COLLECTION);
  return ensureStandardTemplates(templates);
}

export async function getTemplate(id: string): Promise<AuditTemplate | null> {
  return (await listTemplates()).find((t) => t.id === id) ?? null;
}

export interface TemplateInput {
  title: string;
  description: string;
  sections: SectionDef[];
  isActive: boolean;
}

export async function createTemplate(
  input: TemplateInput,
  creator: { id: string; name: string }
): Promise<AuditTemplate> {
  const templates = await listTemplates();
  const now = new Date().toISOString();
  const template: AuditTemplate = {
    id: randomUUID(),
    title: input.title,
    description: input.description,
    sections: input.sections,
    isActive: input.isActive,
    createdBy: creator.id,
    createdByName: creator.name,
    createdAt: now,
    updatedAt: now,
  };
  await writeCollection(COLLECTION, [...templates, template]);
  return template;
}

export async function updateTemplate(id: string, input: TemplateInput): Promise<AuditTemplate | null> {
  const templates = await listTemplates();
  const index = templates.findIndex((t) => t.id === id);
  if (index === -1) return null;
  const updated: AuditTemplate = {
    ...templates[index],
    title: input.title,
    description: input.description,
    sections: input.sections,
    isActive: input.isActive,
    updatedAt: new Date().toISOString(),
  };
  templates[index] = updated;
  await writeCollection(COLLECTION, templates);
  return updated;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const templates = await listTemplates();
  const next = templates.filter((t) => t.id !== id);
  if (next.length === templates.length) return false;
  await writeCollection(COLLECTION, next);
  return true;
}

export async function duplicateTemplate(
  id: string,
  creator: { id: string; name: string }
): Promise<AuditTemplate | null> {
  const source = await getTemplate(id);
  if (!source) return null;

  const questionIdMap = new Map<string, string>();
  for (const section of source.sections) {
    for (const question of section.questions) questionIdMap.set(question.id, randomUUID());
  }

  const sections: SectionDef[] = source.sections.map((section) => ({
    id: randomUUID(),
    label: section.label,
    questions: section.questions.map((question) => ({
      ...question,
      id: questionIdMap.get(question.id)!,
      dependsOn: question.dependsOn
        ? {
            questionId: questionIdMap.get(question.dependsOn.questionId) ?? question.dependsOn.questionId,
            triggerValues: question.dependsOn.triggerValues,
          }
        : undefined,
    })),
  }));

  return createTemplate({ title: `Copie de ${source.title}`, description: source.description, sections, isActive: false }, creator);
}
