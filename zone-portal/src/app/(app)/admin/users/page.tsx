"use client";

import { useEffect, useState } from "react";
import { ZoneBadge } from "@/components/ZoneBadge";
import { UserRecord } from "@/lib/types";

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Admin" | "User">("User");
  const [zonesInput, setZonesInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addUser() {
    setError(null);
    setSaving(true);
    const zones = zonesInput.split(",").map((z) => z.trim()).filter(Boolean);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role, zones }),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Failed to add user");
      return;
    }
    setEmail("");
    setZonesInput("");
    load();
  }

  async function toggleStatus(user: UserRecord) {
    await fetch(`/api/admin/users/${encodeURIComponent(user.Email)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Status: user.Status === "Active" ? "Disabled" : "Active" }),
    });
    load();
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-ink">Users & Zones</h1>
        <p className="text-sm text-muted">Provision access by email and assign the Zone(s) each person can see.</p>
      </div>

      <div className="mb-6 rounded-lg border border-border bg-panel p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">Add user</h2>
        <div className="flex flex-wrap gap-2">
          <input
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 min-w-[200px] rounded-md border border-border px-2.5 py-1.5 text-sm focus:border-accent"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "Admin" | "User")}
            className="rounded-md border border-border px-2.5 py-1.5 text-sm focus:border-accent"
          >
            <option value="User">User</option>
            <option value="Admin">Admin</option>
          </select>
          <input
            placeholder="Zones, comma-separated (e.g. North, East)"
            value={zonesInput}
            onChange={(e) => setZonesInput(e.target.value)}
            className="flex-1 min-w-[220px] rounded-md border border-border px-2.5 py-1.5 text-sm focus:border-accent"
          />
          <button
            onClick={addUser}
            disabled={saving || !email}
            className="rounded-md bg-ink px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "Adding…" : "Add"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-rejected">{error}</p>}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <div className="overflow-auto rounded-lg border border-border bg-panel">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-paper">
                <th className="px-3 py-2 text-left font-medium text-muted">Email</th>
                <th className="px-3 py-2 text-left font-medium text-muted">Role</th>
                <th className="px-3 py-2 text-left font-medium text-muted">Zones</th>
                <th className="px-3 py-2 text-left font-medium text-muted">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.Email} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-mono text-xs text-ink">{u.Email}</td>
                  <td className="px-3 py-2 text-ink">{u.Role}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {u.Zones.split(",").filter(Boolean).map((z) => (
                        <ZoneBadge key={z} zone={z.trim()} />
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-ink">{u.Status}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => toggleStatus(u)} className="text-xs font-medium text-accent hover:underline">
                      {u.Status === "Active" ? "Disable" : "Re-enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
