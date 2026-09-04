import { SessionPayload } from "@/lib/auth/session";
import { AuditTemplate } from "./types";

/** SUPERADMIN can edit/delete any template; an ADMIN only their own. */
export function canManageTemplate(session: SessionPayload, template: AuditTemplate): boolean {
  if (session.role === "SUPERADMIN") return true;
  return session.role === "ADMIN" && template.createdBy === session.sub;
}
