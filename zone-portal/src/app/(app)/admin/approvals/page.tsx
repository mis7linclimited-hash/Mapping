"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { ZoneBadge } from "@/components/ZoneBadge";
import { EditRecord, MasterDataRow } from "@/lib/types";

export default function ApprovalsPage() {
  const [edits, setEdits] = useState<EditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/edits?status=Pending");
    const data = await res.json();
    setEdits(data.edits ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(editId: string, decision: "Approved" | "Rejected") {
    setBusyId(editId);
    await fetch(`/api/edits/${editId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, feedback: feedbackDrafts[editId] ?? "" }),
    });
    setBusyId(null);
    load();
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-ink">Approvals</h1>
        <p className="text-sm text-muted">Pending edits across all Zones. Approving writes the change into Master Data.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : edits.length === 0 ? (
        <div className="rounded-lg border border-border bg-panel p-10 text-center text-sm text-muted">
          Nothing pending — you're caught up.
        </div>
      ) : (
        <div className="space-y-3">
          {edits.map((edit) => {
            const proposed: MasterDataRow = JSON.parse(edit.ProposedData);
            const changed = edit.ChangedFields.split(",").filter(Boolean);
            return (
              <div key={edit.EditId} className="rounded-lg border border-border bg-panel p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ZoneBadge zone={edit.Zone} />
                    <span className="text-sm font-medium text-ink">{edit.SubmittedBy}</span>
                    <span className="text-xs text-muted">{new Date(edit.SubmittedAt).toLocaleString()}</span>
                  </div>
                  <StatusBadge status={edit.Status} />
                </div>

                <table className="mt-3 w-full text-sm">
                  <tbody>
                    {changed.map((field) => (
                      <tr key={field} className="border-t border-border">
                        <td className="py-1.5 pr-4 font-medium text-muted">{field}</td>
                        <td className="py-1.5 font-mono text-xs text-ink">{proposed[field as keyof MasterDataRow]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <input
                  placeholder="Feedback (optional, shown to the submitter)"
                  value={feedbackDrafts[edit.EditId] ?? ""}
                  onChange={(e) => setFeedbackDrafts({ ...feedbackDrafts, [edit.EditId]: e.target.value })}
                  className="mt-3 w-full rounded-md border border-border px-2.5 py-1.5 text-sm focus:border-accent"
                />

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => decide(edit.EditId, "Approved")}
                    disabled={busyId === edit.EditId}
                    className="rounded-md bg-approved px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => decide(edit.EditId, "Rejected")}
                    disabled={busyId === edit.EditId}
                    className="rounded-md bg-rejected px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
