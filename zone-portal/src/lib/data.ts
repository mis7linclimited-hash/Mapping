import { v4 as uuid } from "uuid";
import {
  appendTableRow,
  readTableAsObjects,
  updateTableRowByKey,
} from "./graphService";
import {
  EDITS_COLUMNS,
  EditRecord,
  EditStatus,
  MASTER_DATA_COLUMNS,
  MasterDataRow,
  USERS_COLUMNS,
  UserRecord,
} from "./types";
import { logAudit } from "./audit";

function inZones(rowZone: string, zones: string[]): boolean {
  return zones.includes(rowZone);
}

/** Distinct Zone names, sourced from MasterDataTable. Used to give Admins
 * "every Zone" without hardcoding a Zone list anywhere. */
export async function listAllZones(): Promise<string[]> {
  const rows = await readTableAsObjects<MasterDataRow>("MasterDataTable", MASTER_DATA_COLUMNS);
  return Array.from(new Set(rows.map((r) => r.Zone))).sort();
}

// ── Users / Zones ──────────────────────────────────────────────────────────

export async function getUserRecord(email: string): Promise<UserRecord | null> {
  const users = await readTableAsObjects<UserRecord>("UsersTable", USERS_COLUMNS);
  return users.find((u) => u.Email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function listUsers(): Promise<UserRecord[]> {
  return readTableAsObjects<UserRecord>("UsersTable", USERS_COLUMNS);
}

export async function addUser(input: {
  email: string;
  role: "Admin" | "User";
  zones: string[];
  addedBy: string;
}): Promise<void> {
  await appendTableRow("UsersTable", [
    input.email,
    input.role,
    input.zones.join(","),
    "Active",
    input.addedBy,
    new Date().toISOString(),
  ]);
  await logAudit({
    actorEmail: input.addedBy,
    actorRole: "Admin",
    action: "USER_ADDED",
    details: `${input.email} added as ${input.role} for zones: ${input.zones.join(", ")}`,
    relatedId: input.email,
  });
}

export async function updateUser(
  email: string,
  updates: Partial<Pick<UserRecord, "Role" | "Zones" | "Status">>,
  actorEmail: string
): Promise<void> {
  const existing = await getUserRecord(email);
  if (!existing) throw new Error(`User ${email} not found`);

  const merged: UserRecord = { ...existing, ...updates };
  await updateTableRowByKey(
    "UsersTable",
    USERS_COLUMNS,
    "Email",
    email,
    [merged.Email, merged.Role, merged.Zones, merged.Status, merged.AddedBy, merged.AddedAt]
  );
  await logAudit({
    actorEmail,
    actorRole: "Admin",
    action: "USER_UPDATED",
    details: `${email} updated: ${JSON.stringify(updates)}`,
    relatedId: email,
  });
}

// ── Master data, Zone-filtered ──────────────────────────────────────────────

export async function getMasterDataForZones(zones: string[]): Promise<MasterDataRow[]> {
  const rows = await readTableAsObjects<MasterDataRow>("MasterDataTable", MASTER_DATA_COLUMNS);
  return rows.filter((row) => inZones(row.Zone, zones));
}

// ── Edits workflow ──────────────────────────────────────────────────────────

export async function submitEdit(input: {
  rowId: string;
  zone: string;
  submittedBy: string;
  proposedData: MasterDataRow;
  changedFields: string[];
}): Promise<string> {
  const editId = uuid();
  await appendTableRow("EditsTable", [
    editId,
    input.rowId,
    input.zone,
    input.submittedBy,
    new Date().toISOString(),
    JSON.stringify(input.proposedData),
    input.changedFields.join(","),
    "Pending" as EditStatus,
    "",
    "",
    "",
  ]);
  await logAudit({
    actorEmail: input.submittedBy,
    actorRole: "User",
    action: "EDIT_SUBMITTED",
    details: `Proposed changes to row ${input.rowId} (${input.changedFields.join(", ")})`,
    relatedId: editId,
  });
  return editId;
}

export async function listEdits(filter: {
  submittedBy?: string;
  status?: EditStatus;
}): Promise<EditRecord[]> {
  const edits = await readTableAsObjects<EditRecord>("EditsTable", EDITS_COLUMNS);
  return edits.filter(
    (e) =>
      (!filter.submittedBy || e.SubmittedBy.toLowerCase() === filter.submittedBy.toLowerCase()) &&
      (!filter.status || e.Status === filter.status)
  );
}

export async function reviewEdit(input: {
  editId: string;
  decision: "Approved" | "Rejected";
  feedback: string;
  reviewedBy: string;
}): Promise<void> {
  const edits = await readTableAsObjects<EditRecord>("EditsTable", EDITS_COLUMNS);
  const edit = edits.find((e) => e.EditId === input.editId);
  if (!edit) throw new Error(`Edit ${input.editId} not found`);
  if (edit.Status !== "Pending") throw new Error(`Edit ${input.editId} already reviewed`);

  const reviewedAt = new Date().toISOString();

  await updateTableRowByKey("EditsTable", EDITS_COLUMNS, "EditId", input.editId, [
    edit.EditId,
    edit.RowId,
    edit.Zone,
    edit.SubmittedBy,
    edit.SubmittedAt,
    edit.ProposedData,
    edit.ChangedFields,
    input.decision,
    input.reviewedBy,
    reviewedAt,
    input.feedback,
  ]);

  if (input.decision === "Approved") {
    const proposed: MasterDataRow = JSON.parse(edit.ProposedData);
    await updateTableRowByKey(
      "MasterDataTable",
      MASTER_DATA_COLUMNS,
      "RowId",
      edit.RowId,
      MASTER_DATA_COLUMNS.map((col) => proposed[col])
    );
  }

  await logAudit({
    actorEmail: input.reviewedBy,
    actorRole: "Admin",
    action: input.decision === "Approved" ? "EDIT_APPROVED" : "EDIT_REJECTED",
    details: `Edit ${input.editId} on row ${edit.RowId}${input.feedback ? `: ${input.feedback}` : ""}`,
    relatedId: input.editId,
  });
}
