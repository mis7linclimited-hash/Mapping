import { auth } from "@/auth";
import { readTableAsObjects } from "@/lib/graphService";
import { AUDIT_LOG_COLUMNS, AuditLogEntry } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "Admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const action = new URL(req.url).searchParams.get("action");
  let entries = await readTableAsObjects<AuditLogEntry>("AuditLogTable", AUDIT_LOG_COLUMNS);
  if (action) entries = entries.filter((e) => e.Action === action);

  entries.sort((a, b) => b.Timestamp.localeCompare(a.Timestamp));
  return NextResponse.json({ entries });
}
