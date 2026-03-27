# SAR Realtime Collaboration Design (Demo)

- Date: 2026-03-27
- Scope: Demo implementation for `/sar` realtime text editing
- References:
  - `Document/BusinessAnalytics/Sar/SAR_RealtimeCollaboration_v4.md`
  - `Document/BusinessAnalytics/MainDocument/22-03-2026/RBAC_Permission_Matrix_v1_4.md`
  - `Document/BusinessAnalytics/MainDocument/22-03-2026/System_Blueprint_v2_6.md`

## 1. Goal and Boundaries

### 1.1 Goal
Build a demo-ready SAR editing feature with realtime collaboration, following the architecture direction in `SAR_RealtimeCollaboration_v4.md`:
- Editor: TipTap
- Sync: Yjs (CRDT)
- Transport: Node.js `y-websocket`
- Persistence: `YDocSnapshot` + `RenderedHtml` in SQL Server (`SarReport` table)

### 1.2 Included in this demo
- New `/sar` page as grid (one row per cycle, one SAR per cycle)
- Full-screen popup editor on row click
- Realtime text sync between multiple clients in the same cycle room
- Save to DB (autosave + final save on close)
- SAR draft is created automatically when cycle is created

### 1.3 Excluded from this demo
- Internal review workflow (`/internalreview`)
- Approval/lock flow
- Evidence drag-drop and structured SAR block assembly
- Awareness cursors/avatars
- `.docx` export

## 2. Decisions Confirmed With User

1. Use roadmap-aligned stack (`TipTap + Yjs + Node y-websocket`) instead of a quick textarea approach.
2. Room scope is by cycle (`sar_cycle_{cycleId}`).
3. `/sar` UX pattern follows existing list pages: grid -> full-screen popup editor.
4. Data must be persisted to DB for demo.
5. `SarReport` record is created immediately when a cycle is created.
6. Database currently has no FK for `SarReport` to speed up iteration; integrity is enforced in service logic.

## 3. Architecture Overview

## 3.1 Components
- `AUN-QA.Web`
  - `/sar` list page
  - Full-screen SAR editor popup
  - TipTap + Yjs integration
  - Autosave pipeline to Business API
- `AUN-QA.BusinessService`
  - `SarController` and SAR services
  - Cycle insertion hook creates initial SAR draft
  - Authorization checks for SAR page actions
  - Persistence into `SarReport`
- `AUN-QA.CollabService` (new Node service)
  - Hosts `y-websocket` server
  - Room-based CRDT sync transport only
- SQL Server (`business`)
  - `SarReport` table already scaffolded to `BusinessService`

## 3.2 Data Ownership
- Canonical collaborative state during editing session: `Y.Doc`
- Canonical persisted state in this demo: `SarReport.YDocSnapshot`
- Derived/read model for non-collab display: `SarReport.RenderedHtml`

## 4. Data Model (Current Scaffold)

`SarReport` (already present):
- `Id` (Guid)
- `CycleId` (Guid)
- `Status` (int, default 1 = Draft)
- `YDocSnapshot` (varbinary(max), nullable)
- `RenderedHtml` (nvarchar(max), nullable)
- `LastSavedAt` (datetime, nullable)
- `CreatedAt`, `CreatedBy`, `UpdatedAt`, `UpdatedBy`, `IsActived`, `IsDeleted`

### 4.1 Service-level invariants (because no FK)
- `CycleId` must exist and be active before SAR read/save operations.
- At most one active SAR per cycle (`IsDeleted = 0`) must be maintained by service checks.
- Soft-delete semantics are consistent with existing entities.

## 5. Backend Design (`AUN-QA.BusinessService`)

## 5.1 New SAR APIs
Controller name should be `SarController` so frontend pathname `/sar` aligns with current permission resolution.

Proposed endpoints:
- `POST /Business/Sar/get-list`
  - Input: paging + optional filters (`TextSearch`, `Status`, etc.)
  - Output: one row per cycle + SAR metadata for grid
- `POST /Business/Sar/get-by-cycle`
  - Input: `CycleId`
  - Output: SAR draft payload (`Id`, `CycleId`, `Status`, `YDocSnapshot`, `RenderedHtml`, `LastSavedAt`, metadata)
- `POST /Business/Sar/save-draft`
  - Input: `CycleId`, `YDocSnapshotBase64`, `RenderedHtml`
  - Behavior: create-if-missing fallback, update snapshot/html/timestamps

Optional helper endpoint:
- `POST /Business/Sar/create-if-missing`
  - Mainly internal/fallback safety path

## 5.2 Cycle integration
In `CycleService.Insert`:
- After cycle creation (same transaction scope), create one `SarReport` draft row:
  - `Id = Guid.NewGuid()`
  - `CycleId = createdCycleId`
  - `Status = 1`
  - `CreatedAt/By`, `IsActived = true`, `IsDeleted = false`

## 5.3 Permission model (demo)
Based on RBAC v1.4 for `/sar` (simplified for demo scope):
- Allow View/Edit: `HeadOfCouncil`, `ViceChairman`, `Secretary`, `Evaluator`
- Allow View (for monitor use): `Admin`
- Deny: `Provider`, `User`, `ExternalReviewer`

Implementation approach:
- Keep existing controller-level permission (`AttributePermission`) for menu access.
- Add domain-level checks in SAR service using cycle membership/role via `ICycleService` to enforce cycle scope.

## 6. Frontend Design (`AUN-QA.Web`)

## 6.1 Route and page
- Add route: `/sar`
- New page pattern follows existing grid pages (`/cycle`, `/surveycampaign`, etc.)

Grid columns (demo-focused):
- Cycle name
- Year
- SAR status (Draft)
- Last saved at
- Updated by

Action:
- Row click -> open full-screen popup editor

## 6.2 Editor popup
- Full-screen dialog component (consistent with current UI library)
- TipTap editor instance + Yjs provider bound to room `sar_cycle_{cycleId}`
- Initial hydration:
  - If `YDocSnapshot` exists: apply snapshot to Y.Doc
  - Else: start from empty/default draft content

## 6.3 Save flow
- Debounced autosave (2-3 seconds idle)
- Save on popup close as final flush
- Save payload:
  - `CycleId`
  - `YDocSnapshotBase64` (from Yjs state update/snapshot encode)
  - `RenderedHtml` (TipTap HTML serialization)

## 7. Realtime Transport Design (`AUN-QA.CollabService`)

## 7.1 Service responsibilities
- Host websocket endpoint for Yjs sync (`y-websocket`)
- Manage room channels only
- Do not implement business workflow or approval logic

## 7.2 Runtime integration
- Add `AUN-QA.CollabService` to AppHost for local orchestration
- Frontend env example:
  - `VITE_SAR_WS_URL=ws://localhost:1234`

## 7.3 Room naming
- `sar_cycle_{cycleId}`
- Single room per cycle to match “one cycle = one SAR report” rule

## 8. Error Handling

## 8.1 Backend
- Return business errors for:
  - Missing/invalid `CycleId`
  - Cycle not accessible by current user
  - Missing SAR row when create-if-missing disabled
  - Invalid base64 payload for snapshot

## 8.2 Frontend
- If websocket connect fails:
  - Show non-blocking warning
  - Keep editor available for local typing
  - Retry connection with backoff
- If save fails:
  - Keep dirty flag
  - Show retry action/toast

## 9. Test Strategy (Demo Acceptance)

## 9.1 Functional tests
1. Create new cycle -> corresponding `SarReport` draft row exists.
2. `/sar` grid lists cycles correctly for authorized users.
3. Unauthorized roles cannot access `/sar`.
4. Open same cycle in two tabs -> edits sync in realtime.
5. Refresh/reopen popup -> content restored from `YDocSnapshot` persisted data.
6. Closing popup triggers final save.

## 9.2 Non-functional checks (lightweight)
- Save payload size acceptable for expected SAR draft length.
- No blocking UI when autosave is in-flight.
- Reconnect works after collab service restart.

## 10. Rollout Plan (After Design)

Phase 1 (Backend foundation):
- Add SAR DTOs, service, controller, cycle integration.

Phase 2 (Collab transport):
- Stand up `AUN-QA.CollabService` with `y-websocket` and AppHost wiring.

Phase 3 (Frontend UX):
- Add `/sar` page, grid, full-screen popup, TipTap+Yjs integration.

Phase 4 (Verification):
- Execute acceptance checklist with two browsers/two users.

## 11. Risks and Mitigations

- No FK risk: enforce strict existence/uniqueness checks in service and logging.
- Snapshot compatibility risk: keep a stable encoding/decoding strategy and version notes if schema evolves.
- Concurrent save overwrite risk: persist latest Yjs state (CRDT-merged) rather than plain text diffs.

## 12. Out of Scope but Next

- Awareness (cursor/avatar)
- Lock flow for internal review and approval
- Evidence drag/drop blocks
- `.docx` generation/export pipeline
- Moving from local/demo persistence to full CRDT infra persistence (redis/snapshot log) per roadmap v4
