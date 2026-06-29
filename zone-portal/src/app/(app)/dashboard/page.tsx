"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { EditRowDrawer } from "@/components/EditRowDrawer";
import { MASTER_DATA_COLUMNS, MasterDataRow } from "@/lib/types";

export default function MasterDataPage() {
  const [rows, setRows] = useState<MasterDataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MasterDataRow | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/master-data");
    const data = await res.json();
    setRows(data.rows ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-ink">Master Data</h1>
        <p className="text-sm text-muted">
          Editable. Changes you submit are queued for Admin approval before they take effect.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <DataTable columns={MASTER_DATA_COLUMNS} rows={rows} onEditRow={(r) => setEditing(r as MasterDataRow)} />
      )}

      {editing && (
        <EditRowDrawer
          row={editing}
          onClose={() => setEditing(null)}
          onSubmitted={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}
