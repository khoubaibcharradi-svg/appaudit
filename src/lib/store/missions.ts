import { randomUUID } from "crypto";
import { AuditMission } from "@/lib/audit/types";
import { readCollection, writeCollection } from "./jsonStore";

const COLLECTION = "missions";

export async function listMissions(): Promise<AuditMission[]> {
  const missions = await readCollection<AuditMission>(COLLECTION);
  return [...missions].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
}

export async function listMissionsForUser(userId: string): Promise<AuditMission[]> {
  return (await listMissions()).filter((m) => m.assignedTo === userId);
}

export async function getMission(id: string): Promise<AuditMission | null> {
  return (await listMissions()).find((m) => m.id === id) ?? null;
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
  const missions = await readCollection<AuditMission>(COLLECTION);
  const mission: AuditMission = {
    id: randomUUID(),
    ...input,
    createdBy: creator.id,
    createdByName: creator.name,
    status: "PLANIFIEE",
    createdAt: new Date().toISOString(),
  };
  await writeCollection(COLLECTION, [...missions, mission]);
  return mission;
}

export async function markMissionSubmitted(missionId: string, submissionId: string): Promise<void> {
  const missions = await readCollection<AuditMission>(COLLECTION);
  const index = missions.findIndex((m) => m.id === missionId);
  if (index === -1) return;
  missions[index] = { ...missions[index], status: "TERMINEE", submissionId };
  await writeCollection(COLLECTION, missions);
}
