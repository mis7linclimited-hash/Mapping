"use client";

import { signOut } from "next-auth/react";
import { ZoneBadge } from "./ZoneBadge";
import { Role } from "@/lib/types";

export function Topbar({
  email,
  role,
  zones,
}: {
  email: string;
  role: Role;
  zones: string[];
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-panel px-6">
      <div className="flex items-center gap-2">
        {role === "Admin" ? (
          <span className="rounded-md bg-ink px-2 py-0.5 text-xs font-medium text-white">Admin</span>
        ) : (
          zones.map((z) => <ZoneBadge key={z} zone={z} />)
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs text-muted">{email}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-sm font-medium text-muted hover:text-ink"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
