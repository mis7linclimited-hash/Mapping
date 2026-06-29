// Column order here must exactly match the column order of the corresponding
// Excel Table. Graph's Excel API reads/writes rows as plain arrays of values,
// so this list is the single source of truth for "which column is which".

export const MASTER_DATA_COLUMNS = [
  "RowId",
  "Zone",
  "Cp code",
  "Cp name",
  "Distributor Tally code",
  "Distributor Code",
  "Distributor Name",
  "Distributor dist",
  "Distributor State",
  "Distributor City",
  "Distributor type",
  "be code",
  "be name",
  "tm code",
  "tm name",
  "abm code",
  "abm name",
  "rbm code",
  "rbm name",
  "Zbm code",
  "zbm name",
] as const;

export type MasterDataColumn = (typeof MASTER_DATA_COLUMNS)[number];

export type MasterDataRow = {
  [K in MasterDataColumn]: string;
};

export type EditStatus = "Pending" | "Approved" | "Rejected";

export const EDITS_COLUMNS = [
  "EditId",
  "RowId",
  "Zone",
  "SubmittedBy",
  "SubmittedAt",
  "ProposedData", // JSON string of the full proposed MasterDataRow
  "ChangedFields", // comma-separated list of column names that changed
  "Status",
  "ReviewedBy",
  "ReviewedAt",
  "AdminFeedback",
] as const;

export type EditRecord = {
  EditId: string;
  RowId: string;
  Zone: string;
  SubmittedBy: string;
  SubmittedAt: string;
  ProposedData: string;
  ChangedFields: string;
  Status: EditStatus;
  ReviewedBy: string;
  ReviewedAt: string;
  AdminFeedback: string;
};

export type Role = "Admin" | "User";

export const USERS_COLUMNS = [
  "Email",
  "Role",
  "Zones", // comma-separated
  "Status", // Active | Disabled
  "AddedBy",
  "AddedAt",
] as const;

export type UserRecord = {
  Email: string;
  Role: Role;
  Zones: string;
  Status: "Active" | "Disabled";
  AddedBy: string;
  AddedAt: string;
};

export const AUDIT_LOG_COLUMNS = [
  "LogId",
  "Timestamp",
  "ActorEmail",
  "ActorRole",
  "Action",
  "Details",
  "RelatedId",
] as const;

export type AuditLogEntry = {
  LogId: string;
  Timestamp: string;
  ActorEmail: string;
  ActorRole: string;
  Action: string;
  Details: string;
  RelatedId: string;
};

// Session shape attached by Auth.js after the UsersTable lookup in auth.ts
export type SessionUser = {
  email: string;
  role: Role;
  zones: string[];
};
