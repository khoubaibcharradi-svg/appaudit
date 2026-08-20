import { randomUUID } from "crypto";
import { AuditTemplate, SectionDef } from "@/lib/audit/types";
import { readCollection, writeCollection } from "./jsonStore";

const COLLECTION = "templates";

export async function listTemplates(): Promise<AuditTemplate[]> {
  return readCollection<AuditTemplate>(COLLECTION);
}

export async function listActiveTemplates(): Promise<AuditTemplate[]> {
  return (await listTemplates()).filter((t) => t.isActive);
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
