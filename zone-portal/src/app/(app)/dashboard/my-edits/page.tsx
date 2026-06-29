"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { ZoneBadge } from "@/components/ZoneBadge";
import { EditRecord } from "@/lib/types";

export default function MyEditsPage() {
  const [edits, setEdits] = useState<EditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/edits")
      .then((res) => res.json())
      .then((data) => setEdits(data.edits ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-ink">My Edits</h1>
        <p className="text-sm text-muted">Status of changes you've submitted, and any feedback from your Admin.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : edits.length === 0 ? (
        <div className="rounded-lg border border-border bg-panel p-10 text-center text-sm text-muted">
          You haven't submitted any edits yet.
        </div>
      ) : (
        <div className="space-y-2">
          {edits
            .sort((a, b) => b.SubmittedAt.localeCompare(a.SubmittedAt))
            .map((edit) => (
              <div key={edit.EditId} className="rounded-lg border border-border bg-panel p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ZoneBadge zone={edit.Zone} />
                    <span className="text-xs text-muted">
                      Submitted {new Date(edit.SubmittedAt).toLocaleString()}
                    </span>
                  </div>
                  <StatusBadge status={edit.Status} />
                </div>
                <p className="mt-2 text-sm text-ink">
                  Changed: <span className="font-mono text-xs">{edit.ChangedFields}</span>
                </p>
                {edit.AdminFeedback && (
                  <p className="mt-2 rounded-md bg-paper p-2 text-sm text-ink">
                    <span className="font-medium">Admin feedback: </span>
                    {edit.AdminFeedback}
                  </p>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
