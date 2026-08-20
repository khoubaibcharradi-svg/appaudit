import { randomUUID } from "crypto";
import { buildDepotStandardSections, buildUsineStandardSections } from "@/lib/audit/standardTemplate";
import { AuditTemplate, SectionDef } from "@/lib/audit/types";
import { readCollection, writeCollection } from "./jsonStore";
import { findAnySuperAdmin } from "./users";

const COLLECTION = "templates";

function buildStandardTemplate(
  title: string,
  description: string,
  sections: SectionDef[],
  creator: { id: string; name: string }
): AuditTemplate {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    title,
    description,
    sections,
    isActive: false,
    createdBy: creator.id,
    createdByName: creator.name,
    createdAt: now,
    updatedAt: now,
  };
}

async function seedIfEmpty(templates: AuditTemplate[]): Promise<AuditTemplate[]> {
  if (templates.length > 0) return templates;

  const creator = await findAnySuperAdmin();
  if (!creator) return templates;

  const standards = [
    buildStandardTemplate(
      "Audit industriel — Usine S2I",
      "Trame standard pour les audits usine : ventes, ordres de fabrication, machines/moules, matières premières, rebuts, recouvrement, RH et sécurité. Dupliquez-le pour créer un nouveau formulaire à partir de cette base.",
      buildUsineStandardSections(),
      creator
    ),
    buildStandardTemplate(
      "Audit logistique et commercial — Dépôt",
      "Trame standard pour les audits dépôt : inventaire stock, clôture de caisse, facturation/livraison, retours clients, organisation et recouvrement. Dupliquez-le pour créer un nouveau formulaire à partir de cette base.",
      buildDepotStandardSections(),
      creator
    ),
  ];
  await writeCollection(COLLECTION, standards);
  return standards;
}

export async function listTemplates(): Promise<AuditTemplate[]> {
  const templates = await readCollection<AuditTemplate>(COLLECTION);
  return seedIfEmpty(templates);
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
