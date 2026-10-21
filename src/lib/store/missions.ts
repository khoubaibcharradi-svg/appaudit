import { randomUUID } from "crypto";
import type { RowDataPacket } from "mysql2/promise";
import { AuditMission } from "@/lib/audit/types";
import pool, { ensureSchema } from "@/lib/db/pool";
import { logger } from "@/lib/logger";

interface MissionRow extends RowDataPacket {
  id: string;
  template_id: string;
  template_title: string;
  site: string;
  scheduled_date: string;
  assigned_to: string;
  assigned_to_name: string;
  created_by: string;
  created_by_name: string;
  status: AuditMission["status"];
  submission_id: string | null;
  created_at: string;
}

function mapMission(row: MissionRow): AuditMission {
  return {
    id: row.id,
    templateId: row.template_id,
    templateTitle: row.template_title,
    site: row.site,
    scheduledDate: row.scheduled_date,
    assignedTo: row.assigned_to,
    assignedToName: row.assigned_to_name,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    status: row.status,
    submissionId: row.submission_id ?? undefined,
    createdAt: row.created_at,
  };
}

export async function listMissions(): Promise<AuditMission[]> {
  await ensureSchema();
  const [rows] = await pool.query<MissionRow[]>("SELECT * FROM missions ORDER BY scheduled_date ASC");
  return rows.map(mapMission);
}

export async function listMissionsForUser(userId: string): Promise<AuditMission[]> {
  await ensureSchema();
  const [rows] = await pool.query<MissionRow[]>(
    "SELECT * FROM missions WHERE assigned_to = ? ORDER BY scheduled_date ASC",
    [userId]
  );
  return rows.map(mapMission);
}

export async function getMission(id: string): Promise<AuditMission | null> {
  await ensureSchema();
  const [rows] = await pool.query<MissionRow[]>("SELECT * FROM missions WHERE id = ? LIMIT 1", [id]);
  return rows[0] ? mapMission(rows[0]) : null;
}

export interface MissionInput {
  templateId: string;
  templateTitle: string;
  site: string;
  scheduledDate: string;
  assignedTo: string;
  assignedToName: string;
}

export async function createMission(
  input: MissionInput,
  creator: { id: string; name: string }
): Promise<AuditMission> {
  await ensureSchema();
  const mission: AuditMission = {
    id: randomUUID(),
    ...input,
    createdBy: creator.id,
    createdByName: creator.name,
    status: "PLANIFIEE",
    createdAt: new Date().toISOString(),
  };
  await pool.query(
    `INSERT INTO missions
       (id, template_id, template_title, site, scheduled_date, assigned_to, assigned_to_name, created_by, created_by_name, status, submission_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      mission.id,
      mission.templateId,
      mission.templateTitle,
      mission.site,
      mission.scheduledDate,
      mission.assignedTo,
      mission.assignedToName,
      mission.createdBy,
      mission.createdByName,
      mission.status,
      null,
      mission.createdAt,
    ]
  );
  logger.info("missions.created", {
    id: mission.id,
    templateId: mission.templateId,
    assignedTo: mission.assignedTo,
    by: creator.id,
  });
  return mission;
}

export async function markMissionSubmitted(missionId: string, submissionId: string): Promise<void> {
  await ensureSchema();
  await pool.query("UPDATE missions SET status = 'TERMINEE', submission_id = ? WHERE id = ?", [
    submissionId,
    missionId,
  ]);
  logger.info("missions.completed", { id: missionId, submissionId });
}
