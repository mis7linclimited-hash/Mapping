"use client";

import { useEffect, useState } from "react";
import { AuditLogEntry } from "@/lib/types";

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/audit")
      .then((res) => res.json())
      .then((data) => setEntries(data.entries ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-ink">Audit Log</h1>
        <p className="text-sm text-muted">Every login, edit, approval, and access change, in one place.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <div className="overflow-auto rounded-lg border border-border bg-panel">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-paper">
                <th className="px-3 py-2 text-left font-medium text-muted">Time</th>
                <th className="px-3 py-2 text-left font-medium text-muted">Actor</th>
                <th className="px-3 py-2 text-left font-medium text-muted">Action</th>
                <th className="px-3 py-2 text-left font-medium text-muted">Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.LogId} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-muted">
                    {new Date(e.Timestamp).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-ink">{e.ActorEmail}</td>
                  <td className="px-3 py-2 text-ink">{e.Action}</td>
                  <td className="px-3 py-2 text-ink">{e.Details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
