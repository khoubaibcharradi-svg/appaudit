import { SessionPayload } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/types";
import { AuditMission, AuditTemplate } from "./types";

/** SUPERADMIN can edit/delete any template; an ADMIN only their own. */
export function canManageTemplate(session: SessionPayload, template: AuditTemplate): boolean {
  if (session.role === "SUPERADMIN") return true;
  return session.role === "ADMIN" && template.createdBy === session.sub;
}

/** The mission's assignee or any admin can work an inventory (import photo, count, close). */
export function canAccessInventory(session: SessionPayload, mission: AuditMission): boolean {
  return mission.assignedTo === session.sub || isAdminRole(session.role);
}
