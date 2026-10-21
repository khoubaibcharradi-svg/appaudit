import { randomUUID } from "crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import {
  buildContainerStandardSections,
  buildDepotStandardSections,
  buildUsineStandardSections,
} from "@/lib/audit/standardTemplate";
import { AuditTemplate, SectionDef } from "@/lib/audit/types";
import pool, { ensureSchema } from "@/lib/db/pool";
import { logger } from "@/lib/logger";
import { findAnySuperAdmin } from "./users";

interface TemplateRow extends RowDataPacket {
  id: string;
  title: string;
  description: string | null;
  sections: SectionDef[] | string;
  is_active: number;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  standard_key: string | null;
}

function parseSections(value: SectionDef[] | string): SectionDef[] {
  return typeof value === "string" ? JSON.parse(value) : value;
}

function mapTemplate(row: TemplateRow): AuditTemplate {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    sections: parseSections(row.sections),
    isActive: Boolean(row.is_active),
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    standardKey: row.standard_key ?? undefined,
  };
}

async function insertTemplate(template: AuditTemplate, ignoreDuplicates = false): Promise<void> {
  await pool.query(
    `INSERT ${ignoreDuplicates ? "IGNORE " : ""}INTO templates
       (id, title, description, sections, is_active, created_by, created_by_name, created_at, updated_at, standard_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      template.id,
      template.title,
      template.description,
      JSON.stringify(template.sections),
      template.isActive ? 1 : 0,
      template.createdBy,
      template.createdByName,
      template.createdAt,
      template.updatedAt,
      template.standardKey ?? null,
    ]
  );
}

interface StandardTemplateDef {
  key: string;
  title: string;
  description: string;
  buildSections: () => SectionDef[];
}

// Adding a new entry here makes it appear automatically for every
// installation (new or existing) — each is only ever created once,
// tracked by `standard_key`, so re-running never duplicates it.
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

async function ensureStandardTemplates(): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT DISTINCT standard_key FROM templates WHERE standard_key IS NOT NULL"
  );
  const existingKeys = new Set(rows.map((r) => r.standard_key as string));
  const missing = STANDARD_TEMPLATES.filter((def) => !existingKeys.has(def.key));
  if (missing.length === 0) return;

  const creator = await findAnySuperAdmin();
  if (!creator) return;

  for (const def of missing) {
    const now = new Date().toISOString();
    await insertTemplate(
      {
        id: randomUUID(),
        title: def.title,
        description: def.description,
        sections: def.buildSections(),
        isActive: false,
        createdBy: creator.email,
        createdByName: creator.name,
        createdAt: now,
        updatedAt: now,
        standardKey: def.key,
      },
      true
    );
  }
  logger.info("templates.standards_seeded", { added: missing.map((m) => m.key) });
}

export async function listTemplates(): Promise<AuditTemplate[]> {
  await ensureSchema();
  await ensureStandardTemplates();
  const [rows] = await pool.query<TemplateRow[]>("SELECT * FROM templates ORDER BY created_at ASC");
  return rows.map(mapTemplate);
}

export async function getTemplate(id: string): Promise<AuditTemplate | null> {
  await ensureSchema();
  const [rows] = await pool.query<TemplateRow[]>("SELECT * FROM templates WHERE id = ? LIMIT 1", [id]);
  return rows[0] ? mapTemplate(rows[0]) : null;
}

export interface TemplateInput {
  title: string;
  description: string;
  sections: SectionDef[];
  isActive: boolean;
}

export async function createTemplate(
  input: TemplateInput,
  creator: { email: string; name: string }
): Promise<AuditTemplate> {
  await ensureSchema();
  const now = new Date().toISOString();
  const template: AuditTemplate = {
    id: randomUUID(),
    title: input.title,
    description: input.description,
    sections: input.sections,
    isActive: input.isActive,
    createdBy: creator.email,
    createdByName: creator.name,
    createdAt: now,
    updatedAt: now,
  };
  await insertTemplate(template);
  logger.info("templates.created", { id: template.id, title: template.title, by: creator.email });
  return template;
}

export async function updateTemplate(id: string, input: TemplateInput): Promise<AuditTemplate | null> {
  await ensureSchema();
  const existing = await getTemplate(id);
  if (!existing) return null;

  const updated: AuditTemplate = {
    ...existing,
    title: input.title,
    description: input.description,
    sections: input.sections,
    isActive: input.isActive,
    updatedAt: new Date().toISOString(),
  };
  await pool.query("UPDATE templates SET title = ?, description = ?, sections = ?, is_active = ?, updated_at = ? WHERE id = ?", [
    updated.title,
    updated.description,
    JSON.stringify(updated.sections),
    updated.isActive ? 1 : 0,
    updated.updatedAt,
    id,
  ]);
  logger.info("templates.updated", { id, title: updated.title });
  return updated;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  await ensureSchema();
  const [result] = await pool.query<ResultSetHeader>("DELETE FROM templates WHERE id = ?", [id]);
  const deleted = result.affectedRows > 0;
  if (deleted) logger.info("templates.deleted", { id });
  return deleted;
}

export async function duplicateTemplate(
  id: string,
  creator: { email: string; name: string }
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

  const duplicate = await createTemplate(
    { title: `Copie de ${source.title}`, description: source.description, sections, isActive: false },
    creator
  );
  logger.info("templates.duplicated", { sourceId: id, newId: duplicate.id });
  return duplicate;
}
