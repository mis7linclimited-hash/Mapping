"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@/lib/types";

const USER_LINKS = [
  { href: "/dashboard", label: "Master Data" },
  { href: "/dashboard/my-edits", label: "My Edits" },
];

const ADMIN_LINKS = [
  { href: "/admin/approvals", label: "Approvals" },
  { href: "/admin/users", label: "Users & Zones" },
  { href: "/admin/audit", label: "Audit Log" },
  { href: "/dashboard", label: "All Data" },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const links = role === "Admin" ? ADMIN_LINKS : USER_LINKS;

  return (
    <nav className="w-56 shrink-0 border-r border-border bg-panel px-3 py-6">
      <div className="mb-6 flex items-center gap-2 px-3">
        <div className="h-6 w-6 rounded-full bg-ink" aria-hidden />
        <span className="font-semibold text-ink">Zone Portal</span>
      </div>
      <ul className="space-y-0.5">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-accent-light text-accent" : "text-ink/80 hover:bg-paper"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
