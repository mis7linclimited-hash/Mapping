import { getGraphAppToken } from "./graphAuth";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

function encodePath(filePath: string): string {
  return filePath
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
}

let cachedWorkbookBase: string | null = null;

/**
 * Resolves the Graph URL prefix for the workbook's /workbook endpoint.
 *
 * Two ways to point at the file, so nobody is forced through Graph Explorer:
 *
 * 1. Path-based (recommended) — set GRAPH_FILE_PATH to the file's path
 *    exactly as it appears in the SharePoint/OneDrive URL, plus either:
 *      - GRAPH_SITE_HOSTNAME (+ optional GRAPH_SITE_PATH) for a SharePoint site, or
 *      - GRAPH_ONEDRIVE_USER for a file in someone's OneDrive for Business.
 *    Both of these are values you can read straight off the address bar —
 *    no API calls needed to find them.
 *
 * 2. ID-based (advanced) — set GRAPH_DRIVE_ID + GRAPH_WORKBOOK_ITEM_ID
 *    directly, if you already resolved them via Graph Explorer or elsewhere.
 *
 * The result only needs resolving once per server instance, so it's cached.
 */
async function resolveWorkbookBase(): Promise<string> {
  if (cachedWorkbookBase) return cachedWorkbookBase;

  // Option 2: explicit IDs, if supplied.
  const driveId = process.env.GRAPH_DRIVE_ID;
  const itemId = process.env.GRAPH_WORKBOOK_ITEM_ID;
  if (driveId && itemId) {
    cachedWorkbookBase = `${GRAPH_BASE}/drives/${driveId}/items/${itemId}/workbook`;
    return cachedWorkbookBase;
  }

  // Option 1: resolve by path.
  const filePath = process.env.GRAPH_FILE_PATH;
  if (!filePath) {
    throw new Error(
      "Set GRAPH_FILE_PATH (+ GRAPH_SITE_HOSTNAME or GRAPH_ONEDRIVE_USER), or GRAPH_DRIVE_ID + GRAPH_WORKBOOK_ITEM_ID."
    );
  }
  const encodedPath = encodePath(filePath);
  const token = await getGraphAppToken();

  if (process.env.GRAPH_SITE_HOSTNAME) {
    const hostname = process.env.GRAPH_SITE_HOSTNAME;
    const sitePath = process.env.GRAPH_SITE_PATH ?? "";
    const siteAddress = sitePath ? `${hostname}:${sitePath}` : hostname;
    const res = await fetch(`${GRAPH_BASE}/sites/${siteAddress}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Could not resolve site "${siteAddress}": ${res.status} ${await res.text()}`);
    }
    const site = await res.json();
    cachedWorkbookBase = `${GRAPH_BASE}/sites/${site.id}/drive/root:/${encodedPath}:/workbook`;
  } else if (process.env.GRAPH_ONEDRIVE_USER) {
    const upn = encodeURIComponent(process.env.GRAPH_ONEDRIVE_USER);
    cachedWorkbookBase = `${GRAPH_BASE}/users/${upn}/drive/root:/${encodedPath}:/workbook`;
  } else {
    throw new Error("Set GRAPH_SITE_HOSTNAME (SharePoint) or GRAPH_ONEDRIVE_USER (OneDrive) alongside GRAPH_FILE_PATH.");
  }

  return cachedWorkbookBase;
}

async function graphFetchUrl(url: string, init?: RequestInit) {
  const token = await getGraphAppToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph request failed (${res.status}) for ${url}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function graphFetch(path: string, init?: RequestInit) {
  const base = await resolveWorkbookBase();
  return graphFetchUrl(`${base}${path}`, init);
}

/**
 * Reads every row of a named Excel Table as raw value arrays, in column order.
 *
 * Pages through the full table using $top + @odata.nextLink rather than
 * trusting a single response — Graph caps how much a single request
 * returns, so without this a "huge rows" table would silently come back
 * truncated. Even so, for genuinely large datasets prefer splitting the
 * source into one table per Zone (see src/lib/zoneTables.ts) so each
 * individual read stays small — paging avoids truncation, it doesn't make
 * reading 200k irrelevant rows fast.
 */
export async function readTableRows(
  tableName: string,
  pageSize = 999
): Promise<unknown[][]> {
  const base = await resolveWorkbookBase();
  const rows: unknown[][] = [];
  let url: string | null = `${base}/tables('${tableName}')/rows?$top=${pageSize}`;

  while (url) {
    const data = await graphFetchUrl(url);
    const page = data.value as Array<{ values: unknown[][] }>;
    rows.push(...page.map((r) => r.values[0]));
    url = data["@odata.nextLink"] ?? null;
  }

  return rows;
}

/** Reads rows and converts them into objects keyed by the given column list. */
export async function readTableAsObjects<T>(
  tableName: string,
  columns: readonly string[]
): Promise<T[]> {
  const rows = await readTableRows(tableName);
  return rows.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => (obj[col] = row[i] ?? ""));
    return obj as T;
  });
}

/** Appends a single row to a named Excel Table. Reliable, documented Graph operation. */
export async function appendTableRow(
  tableName: string,
  values: unknown[]
): Promise<void> {
  await graphFetch(`/tables('${tableName}')/rows`, {
    method: "POST",
    body: JSON.stringify({ values: [values] }),
  });
}

/**
 * Updates an existing row identified by matching `keyColumn === keyValue`.
 *
 * The direct `PATCH .../rows/itemAt(index=N)` endpoint exists but is known to
 * behave inconsistently across tenants (see Microsoft Q&A reports). The
 * reliable path is: find the row's index, ask Graph for that row's worksheet
 * range address, then PATCH the *range* directly — this is the same
 * range-update API Excel's own UI relies on.
 */
export async function updateTableRowByKey(
  tableName: string,
  columns: readonly string[],
  keyColumn: string,
  keyValue: string,
  newValues: unknown[]
): Promise<void> {
  const keyIndex = columns.indexOf(keyColumn);
  if (keyIndex === -1) throw new Error(`Unknown key column "${keyColumn}"`);

  const rows = await readTableRows(tableName);
  const rowIndex = rows.findIndex((row) => String(row[keyIndex]) === keyValue);
  if (rowIndex === -1) {
    throw new Error(`Row with ${keyColumn}="${keyValue}" not found in ${tableName}`);
  }

  const rangeInfo = await graphFetch(
    `/tables('${tableName}')/rows/itemAt(index=${rowIndex})/range`
  );
  const address: string = rangeInfo.address; // e.g. "Sheet1!A5:T5"
  const [sheetName, cellRange] = address.split("!");

  await graphFetch(
    `/worksheets('${sheetName}')/range(address='${cellRange}')`,
    {
      method: "PATCH",
      body: JSON.stringify({ values: [newValues] }),
    }
  );
}

/** Finds a row's full values by matching `keyColumn === keyValue`. */
export async function findTableRow(
  tableName: string,
  columns: readonly string[],
  keyColumn: string,
  keyValue: string
): Promise<unknown[] | null> {
  const keyIndex = columns.indexOf(keyColumn);
  const rows = await readTableRows(tableName);
  const row = rows.find((r) => String(r[keyIndex]) === keyValue);
  return row ?? null;
}
