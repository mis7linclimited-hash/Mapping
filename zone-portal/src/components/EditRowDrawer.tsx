"use client";

import { useState } from "react";
import { MASTER_DATA_COLUMNS, MasterDataRow } from "@/lib/types";
import { ZoneBadge } from "./ZoneBadge";

const LOCKED_COLUMNS = new Set(["RowId", "Zone"]); // identity & visibility — never user-editable

export function EditRowDrawer({
  row,
  onClose,
  onSubmitted,
}: {
  row: MasterDataRow;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [draft, setDraft] = useState<MasterDataRow>(row);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changedFields = MASTER_DATA_COLUMNS.filter((col) => draft[col] !== row[col]);

  async function handleSubmit() {
    if (changedFields.length === 0) {
      onClose();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowId: row.RowId,
          zone: row.Zone,
          proposedData: draft,
          changedFields,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Submit failed");
      onSubmitted();
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/30">
      <div className="h-full w-full max-w-md overflow-auto bg-panel p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Propose edit</h2>
          <ZoneBadge zone={row.Zone} />
        </div>
        <p className="mb-4 text-xs text-muted">
          Changes are sent to your Admin for approval — nothing here is saved until they accept it.
        </p>

        <div className="space-y-3">
          {MASTER_DATA_COLUMNS.filter((col) => !LOCKED_COLUMNS.has(col)).map((col) => (
            <label key={col} className="block">
              <span className="mb-1 block text-xs font-medium text-muted">{col}</span>
              <input
                value={draft[col]}
                onChange={(e) => setDraft({ ...draft, [col]: e.target.value })}
                className={`w-full rounded-md border border-border px-2.5 py-1.5 text-sm focus:border-accent ${
                  /code/i.test(col) ? "font-mono" : ""
                }`}
              />
            </label>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-rejected">{error}</p>}

        <div className="mt-6 flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Submitting…" : `Submit for approval (${changedFields.length} changed)`}
          </button>
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium text-muted hover:bg-paper">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
