import { auth } from "@/auth";
import { addUser, listUsers } from "@/lib/data";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "Admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  const users = await listUsers();
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "Admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = (await req.json()) as { email: string; role: "Admin" | "User"; zones: string[] };
  if (!body.email || !body.role || !Array.isArray(body.zones)) {
    return NextResponse.json({ error: "email, role, and zones[] are required" }, { status: 400 });
  }

  await addUser({
    email: body.email,
    role: body.role,
    zones: body.zones,
    addedBy: session.user.email,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
