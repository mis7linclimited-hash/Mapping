import { v4 as uuid } from "uuid";
import { appendTableRow } from "./graphService";
import { AUDIT_LOG_COLUMNS } from "./types";

export async function logAudit(entry: {
  actorEmail: string;
  actorRole: string;
  action: string;
  details: string;
  relatedId?: string;
}): Promise<void> {
  const row = [
    uuid(),
    new Date().toISOString(),
    entry.actorEmail,
    entry.actorRole,
    entry.action,
    entry.details,
    entry.relatedId ?? "",
  ];
  // Keep this order in lockstep with AUDIT_LOG_COLUMNS.
  void AUDIT_LOG_COLUMNS;
  await appendTableRow("AuditLogTable", row);
}
