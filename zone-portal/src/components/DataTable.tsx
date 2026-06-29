"use client";

import { ZoneBadge } from "./ZoneBadge";

type Row = Record<string, string>;

export function DataTable({
  columns,
  rows,
  onEditRow,
}: {
  columns: readonly string[];
  rows: Row[];
  /** Pass to render an Edit action column; omit for the read-only dataset. */
  onEditRow?: (row: Row) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-panel p-10 text-center text-sm text-muted">
        No rows in your assigned Zone(s) yet.
      </div>
    );
  }

  const isCodeColumn = (col: string) => /code/i.test(col);

  return (
    <div className="overflow-auto rounded-lg border border-border bg-panel">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-paper">
            {columns.map((col) => (
              <th key={col} className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted">
                {col}
              </th>
            ))}
            {onEditRow && <th className="px-3 py-2" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.RowId ?? i} className="border-b border-border last:border-0 hover:bg-paper/60">
              {columns.map((col) => (
                <td
                  key={col}
                  className={`whitespace-nowrap px-3 py-2 ${isCodeColumn(col) ? "font-mono text-xs text-ink/80" : "text-ink"}`}
                >
                  {col === "Zone" ? <ZoneBadge zone={row[col]} /> : row[col]}
                </td>
              ))}
              {onEditRow && (
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => onEditRow(row)}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    Edit
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
