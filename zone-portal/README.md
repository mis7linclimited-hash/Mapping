# Zone Portal

Working scaffold for the Zone-based distributor data portal described in
`architecture.md`. Builds and type-checks cleanly (`npm run build`) against
placeholder env vars — wiring it to your real tenant is the remaining work,
and that part can't be done from outside your Microsoft 365 environment.

Scope note: the original brief also described a second, read-only Power
Query dataset. That's been dropped by request — this build is Master Data +
the edit/approval workflow only.

## What's actually wired up vs. what's a placeholder

**Real, working code:**
- Auth.js sign-in flow against Microsoft Entra ID
- App-only Graph token acquisition (client-credentials)
- Path-based workbook resolution (read it off the SharePoint/OneDrive URL —
  no Graph Explorer / ID lookups needed; see step 3 below)
- Generic Excel-table read/append/update helpers, and the higher-level
  Zone-filtering, edit-submission, approval, and audit-logging logic on top
- All pages and API routes from the architecture doc, with server-side
  Zone/role enforcement on every route

**You still need to supply:**
- Two Entra ID app registrations (steps below)
- The actual Excel workbook with four Tables, matching the column lists in
  `src/lib/types.ts`

## 1. Set up the Excel workbook

In a workbook on SharePoint or OneDrive, create four ranges and convert each
to a Table (select the range → Insert → Table → check "has headers"), named
exactly as below (Table name, not sheet name — set via Table Design → Name):

| Table name | Columns |
|---|---|
| `MasterDataTable` | `RowId` + the 20 columns from your spec, in the order listed in `src/lib/types.ts` |
| `EditsTable` | see `EDITS_COLUMNS` in `src/lib/types.ts` |
| `UsersTable` | see `USERS_COLUMNS` |
| `AuditLogTable` | see `AUDIT_LOG_COLUMNS` |

`RowId` should be filled with a GUID per existing row before go-live (Excel:
`=CONCATENATE(ROW(),"-",RANDBETWEEN(10000,99999))`, then Paste Special →
Values to freeze it). Seed `UsersTable` with at least one Admin row so you
can log in.

## 2. Register two Entra ID apps

**Sign-in app** (Azure Portal → Microsoft Entra ID → App registrations → New):
- Redirect URI: `http://localhost:3000/api/auth/callback/microsoft-entra-id`
  (add your production URL too, once deployed)
- API permissions: Microsoft Graph → Delegated → `openid`, `profile`, `email`
- Certificates & secrets → new client secret → copy it
- Copy the Application (client) ID and Directory (tenant) ID

**Data-access app** (separate registration):
- No redirect URI needed (it never does a browser sign-in)
- API permissions: Microsoft Graph → **Application** → `Files.ReadWrite.All`
  (or a narrower SharePoint application access policy scoped to the one
  document library, if your tenant supports it) → have an admin grant consent
- Certificates & secrets → new client secret → copy it

## 3. Point the app at the workbook

No Graph Explorer needed — open the workbook in your browser and read the
values straight off the URL. For a SharePoint site like
`https://contoso.sharepoint.com/sites/Sales/Shared Documents/ZonePortalData.xlsx`:
```
GRAPH_SITE_HOSTNAME=contoso.sharepoint.com
GRAPH_SITE_PATH=/sites/Sales
GRAPH_FILE_PATH=/Shared Documents/ZonePortalData.xlsx
```
For a file in someone's OneDrive for Business instead, use
`GRAPH_ONEDRIVE_USER=their@email.com` in place of the two `GRAPH_SITE_*`
vars. (If you already have a `driveId`/`itemId` from somewhere else,
`GRAPH_DRIVE_ID` + `GRAPH_WORKBOOK_ITEM_ID` still work too — see
`.env.local.example`.)

## 4. Configure and run

```bash
cp .env.local.example .env.local   # fill in everything from steps 2–3
npm install
npm run dev
```

Visit `http://localhost:3000`, sign in with an email you seeded in
`UsersTable`.

## 5. Deploy

Either Vercel or Azure Static Web Apps work well with this Next.js App
Router structure. Whichever you pick: set the same env vars in the host's
dashboard, and add the production callback URL
(`https://yourdomain.com/api/auth/callback/microsoft-entra-id`) to the
sign-in app registration before testing in production.

## Notes on the things flagged as "open decisions" in the architecture doc

- A user can hold multiple Zones — `UsersTable.Zones` is comma-separated and
  every filter (`session.user.zones`) handles the array already.
- The approvals queue currently polls on page load only; if you want near-
  real-time alerts, the natural next step is a Graph change-notification
  subscription on `EditsTable`, or simple polling with `setInterval`.
- Rejected edits are kept permanently in `EditsTable` for audit purposes —
  there's no delete path in the UI or API.
