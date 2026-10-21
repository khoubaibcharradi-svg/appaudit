import { randomUUID } from "crypto";
import type { RowDataPacket } from "mysql2/promise";
import { AuditMission } from "@/lib/audit/types";
import pool, { ensureSchema } from "@/lib/db/pool";
import { logger } from "@/lib/logger";
import { listSites } from "./sites";
import { listTemplates } from "./templates";
import { listUsers } from "./users";

interface MissionRow extends RowDataPacket {
  id: string;
  template_id: string;
  template_title: string;
  site_code: string;
  site: string;
  scheduled_date: string;
  assigned_to: string;
  assigned_to_name: string;
  created_by: string;
  created_by_name: string;
  status: AuditMission["status"];
  submission_id: string | null;
  is_inventory: number;
  created_at: string;
}

function mapMission(row: MissionRow): AuditMission {
  return {
    id: row.id,
    templateId: row.template_id,
    templateTitle: row.template_title,
    siteCode: row.site_code,
    site: row.site,
    scheduledDate: row.scheduled_date,
    assignedTo: row.assigned_to,
    assignedToName: row.assigned_to_name,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    status: row.status,
    submissionId: row.submission_id ?? undefined,
    isInventory: Boolean(row.is_inventory),
    createdAt: row.created_at,
  };
}

export interface MissionInput {
  templateId: string;
  templateTitle: string;
  siteCode: string;
  site: string;
  scheduledDate: string;
  assignedTo: string;
  assignedToName: string;
  isInventory: boolean;
}

async function insertMission(input: MissionInput, creator: { codeUser: string; name: string }): Promise<AuditMission> {
  const mission: AuditMission = {
    id: randomUUID(),
    ...input,
    createdBy: creator.codeUser,
    createdByName: creator.name,
    status: "PLANIFIEE",
    createdAt: new Date().toISOString(),
  };
  await pool.query(
    `INSERT INTO missions
       (id, template_id, template_title, site_code, site, scheduled_date, assigned_to, assigned_to_name, created_by, created_by_name, status, submission_id, is_inventory, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      mission.id,
      mission.templateId,
      mission.templateTitle,
      mission.siteCode,
      mission.site,
      mission.scheduledDate,
      mission.assignedTo,
      mission.assignedToName,
      mission.createdBy,
      mission.createdByName,
      mission.status,
      null,
      mission.isInventory ? 1 : 0,
      mission.createdAt,
    ]
  );
  logger.info("missions.created", {
    id: mission.id,
    templateId: mission.templateId,
    assignedTo: mission.assignedTo,
    by: creator.codeUser,
  });
  return mission;
}

// Fixed (not random) IDs for the demo rows, so that `INSERT IGNORE` makes
// seeding safe under concurrent requests (e.g. two parallel page loads on a
// fresh install): whichever request wins the race, both compute the same
// IDs, so the loser's insert is a harmless no-op instead of a duplicate row.
const DEMO_MISSION_PLANNED_ID = "00000000-0000-4000-8000-000000000001";
const DEMO_MISSION_DONE_ID = "00000000-0000-4000-8000-000000000002";
const DEMO_SUBMISSION_ID = "00000000-0000-4000-8000-000000000003";

/** Demo data so a fresh install has something to look at: one upcoming and one completed mission. */
async function seedDemoMissions(): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT id FROM missions LIMIT 1");
  if (rows.length > 0) return;

  const [users, templates, sites] = await Promise.all([listUsers(), listTemplates(), listSites()]);
  const personnel = users.find((u) => u.role === "PERSONNEL");
  const admin = users.find((u) => u.role !== "PERSONNEL");
  const depotTemplate = templates.find((t) => t.standardKey === "depot");
  const usineTemplate = templates.find((t) => t.standardKey === "usine");
  const usineSite = sites.find((s) => s.type === "USINE");
  const depotSite = sites.find((s) => s.name === "Dépôt Jendouba");
  if (!personnel || !admin || !depotTemplate || !usineTemplate || !usineSite || !depotSite) return;

  const now = new Date().toISOString();

  await pool.query(
    `INSERT IGNORE INTO missions
       (id, template_id, template_title, site_code, site, scheduled_date, assigned_to, assigned_to_name, created_by, created_by_name, status, submission_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PLANIFIEE', NULL, ?)`,
    [
      DEMO_MISSION_PLANNED_ID,
      usineTemplate.id,
      usineTemplate.title,
      usineSite.code,
      usineSite.name,
      new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      personnel.codeUser,
      personnel.name,
      admin.codeUser,
      admin.name,
      now,
    ]
  );

  await pool.query(
    `INSERT IGNORE INTO missions
       (id, template_id, template_title, site_code, site, scheduled_date, assigned_to, assigned_to_name, created_by, created_by_name, status, submission_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'TERMINEE', ?, ?)`,
    [
      DEMO_MISSION_DONE_ID,
      depotTemplate.id,
      depotTemplate.title,
      depotSite.code,
      depotSite.name,
      new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
      personnel.codeUser,
      personnel.name,
      admin.codeUser,
      admin.name,
      DEMO_SUBMISSION_ID,
      now,
    ]
  );

  const firstQuestionId = depotTemplate.sections[0]?.questions[0]?.id;
  const answers = firstQuestionId ? [{ questionId: firstQuestionId, value: "Exemple de réponse — conforme." }] : [];
  await pool.query(
    `INSERT IGNORE INTO submissions
       (id, template_id, template_title, site_code, site, filled_by, filled_by_name, status, answers, created_at, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?, ?, ?)`,
    [
      DEMO_SUBMISSION_ID,
      depotTemplate.id,
      depotTemplate.title,
      depotSite.code,
      depotSite.name,
      personnel.codeUser,
      personnel.name,
      JSON.stringify(answers),
      now,
      now,
    ]
  );

  logger.info("missions.demo_seeded");
}

export async function listMissions(): Promise<AuditMission[]> {
  await ensureSchema();
  await seedDemoMissions();
  const [rows] = await pool.query<MissionRow[]>("SELECT * FROM missions ORDER BY scheduled_date ASC");
  return rows.map(mapMission);
}

export async function listMissionsForUser(userCode: string): Promise<AuditMission[]> {
  await ensureSchema();
  const [rows] = await pool.query<MissionRow[]>(
    "SELECT * FROM missions WHERE assigned_to = ? ORDER BY scheduled_date ASC",
    [userCode]
  );
  return rows.map(mapMission);
}

export async function getMission(id: string): Promise<AuditMission | null> {
  await ensureSchema();
  const [rows] = await pool.query<MissionRow[]>("SELECT * FROM missions WHERE id = ? LIMIT 1", [id]);
  return rows[0] ? mapMission(rows[0]) : null;
}

export async function createMission(
  input: MissionInput,
  creator: { codeUser: string; name: string }
): Promise<AuditMission> {
  await ensureSchema();
  return insertMission(input, creator);
}

export async function markMissionSubmitted(missionId: string, submissionId: string): Promise<void> {
  await ensureSchema();
  await pool.query("UPDATE missions SET status = 'TERMINEE', submission_id = ? WHERE id = ?", [
    submissionId,
    missionId,
  ]);
  logger.info("missions.completed", { id: missionId, submissionId });
}
