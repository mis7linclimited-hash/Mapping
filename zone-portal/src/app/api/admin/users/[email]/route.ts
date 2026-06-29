import { auth } from "@/auth";
import { updateUser } from "@/lib/data";
import { UserRecord } from "@/lib/types";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "Admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { email } = await params;
  const body = (await req.json()) as Partial<Pick<UserRecord, "Role" | "Zones" | "Status">>;

  try {
    await updateUser(decodeURIComponent(email), body, session.user.email);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
