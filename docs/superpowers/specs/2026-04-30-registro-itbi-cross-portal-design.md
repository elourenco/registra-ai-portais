# Registro/ITBI Cross-Portal Design

Date: 2026-04-30

## Executive Summary

Adjust the Registro do imovel flow across backoffice, supplier, and customer portals using the existing workflow process payload as the source of truth.

The implementation must not create a parallel state machine. It must derive UI from `stage.process.documents`, shared registration document types, and the stage status returned by the API.

Scope:

- Backoffice process detail: Guia de ITBI uploaded by backoffice must not expose a manual validation status control after upload. It is operationally approved by definition.
- Supplier buyer process detail: Registro do imovel must render vertical subcards, and the stage documents card must behave as a read-only document list with view actions only.
- Customer process tracker: completed cards start collapsed with an expand option, the in-progress card is visually highlighted, Registro document labels are readable, and customer sees the Guia de ITBI as viewable backoffice-provided input before sending the Comprovante ITBI.
- Matricula do imovel appears to the customer only after the Comprovante ITBI is approved by backoffice, or when the matricula document already exists in the API payload.

## Technical Analysis

The current repo already has the right primitives:

- `packages/shared/src/workflow/registration-documents.ts` defines the Registro block and document labels.
- `apps/portal-backoffice/src/features/processes/components/process-stage-card.tsx` owns the process stage UI and Registro-specific branch.
- `apps/portal-supplier/src/features/developments/pages/development-buyer-detail-page.tsx` consumes `GET /api/v1/workflows/processes/{processId}` and renders buyer workflow stages with documents.
- `apps/portal-customer/src/features/buyer-process-tracker/components/status-tracker-card.tsx` renders tracker stages and stage documents.
- `apps/portal-customer/src/features/buyer-onboarding/core/buyer-process-response.ts` normalizes registration documents and inserts pending customer documents.

The key architectural decision is to keep responsibility rules at the portal boundary:

- Backoffice can upload Guia de ITBI and validate customer-submitted documents.
- Supplier only observes Registro documents and can view them.
- Customer can view backoffice-provided documents and upload only customer-owned pending documents.

No extra backend fan-out should be introduced. Existing detail queries already include stages and documents. Additional document status mutation after upload is acceptable only if the OpenAPI does not support status in the upload request.

## Implementation Design

### Backoffice

Target file:

- `apps/portal-backoffice/src/features/processes/components/process-stage-card.tsx`
- `apps/portal-backoffice/src/features/processes/components/api-process-detail-view.tsx`
- `apps/portal-backoffice/src/features/processes/api/document-validation-api.ts`

Behavior:

- Guia de ITBI card shows upload action when missing.
- After Guia de ITBI exists, the card shows the document metadata and `Visualizar`.
- It does not show the status select for Guia de ITBI.
- The Guia de ITBI is treated as approved because it is uploaded by backoffice.
- Comprovante ITBI and Matricula/Escritura keep their own validation and metadata behavior.

API handling:

- Validate `POST /api/v1/documents` against `http://localhost:3000/docs.json` before implementation.
- If the upload schema accepts status, send `status: "approved"` for `type=itbi_guide`.
- If it does not accept status, perform upload, refetch, locate the latest `registration/itbi_guide`, and patch it to `approved` using `PATCH /api/v1/documents/{documentId}/status`.

### Supplier

Target file:

- `apps/portal-supplier/src/features/developments/pages/development-buyer-detail-page.tsx`

Behavior:

- Detect Registro stage by `order === 3` or stage name containing `registro`.
- Render Registro card subareas vertically instead of a three-column grid.
- The `Documentos da etapa` subcard is a list.
- Each list item shows:
  - readable document label from shared registration labels;
  - version and file size when available;
  - sender and timestamp when available;
  - `Visualizar` icon button only.
- Do not render document validation badges or status selectors in supplier Registro document list.

Supplier is read-only for these documents. It must not expose upload, approve, reject, or metadata controls in Registro.

### Customer

Target files:

- `apps/portal-customer/src/features/buyer-process-tracker/components/status-tracker-card.tsx`
- `apps/portal-customer/src/features/buyer-onboarding/core/buyer-process-response.ts`

Tracker card behavior:

- Stages with `status === "completed"` start collapsed.
- Completed stages expose an expand/collapse button.
- The `in_progress` stage gets stronger visual emphasis through border/background and status label.
- Pending stages stay expanded only when they have relevant actionable content; otherwise normal compact rendering is acceptable.

Registro document behavior:

- Labels use `REGISTRATION_DOCUMENT_TYPE_LABELS`, so `itbi_guide` becomes `Guia de ITBI`.
- Guia de ITBI, uploaded by backoffice, is visible to the customer with a `Visualizar` action.
- Comprovante ITBI appears as the pending customer action after Guia de ITBI exists.
- Matricula do imovel appears only after Comprovante ITBI is approved, or when the matricula/registered deed document already exists in the API payload.
- Customer upload actions remain restricted to customer-owned pending/rejected documents. Backoffice-owned documents are view-only.

Document view:

- Use an authenticated download path or existing document open helper. If the customer portal lacks a helper, add a small local API helper consistent with the existing `apiRequest`/token pattern.

## Error Handling

- Upload errors remain visible through existing mutation error surfaces and toast/error blocks.
- If the Guia de ITBI auto-approval step fails after upload, the UI must not silently claim success. Show the mutation error and refetch so the operator can retry or see the real persisted state.
- If document download fails, show an actionable Portuguese error and keep the stage state unchanged.
- If the API returns unknown registration document types, render the raw type only as fallback after checking shared labels.

## Testing and Verification

Required checks:

- Validate OpenAPI for `POST /api/v1/documents`, `PATCH /api/v1/documents/{documentId}/status`, and `GET /api/v1/documents/{documentId}/download`.
- Run `pnpm typecheck`.
- Run builds for impacted apps if the repo supports app-level filters; otherwise run the existing build command used by the monorepo.
- Manually inspect or screenshot the three affected views if local data/session is available.

Behavioral cases:

- Backoffice uploads Guia de ITBI and no status select appears afterward.
- Supplier sees Registro documents as a vertical read-only list with only view actions.
- Customer sees completed cards collapsed, can expand them, and the current stage is visually highlighted.
- Customer sees `Guia de ITBI` label, can view it, and sees Comprovante ITBI as the pending action.
- Matricula do imovel does not appear before Comprovante ITBI approval unless the API already returned a matricula/registered deed document.

## Trade-offs

Keeping this portal-local avoids premature shared UI abstractions and respects different permissions per actor. The cost is a small amount of duplicated rendering logic for document labels and view actions.

Auto-approving Guia de ITBI in the frontend is pragmatic if the backend upload endpoint does not accept status. The cleaner long-term model is backend-side defaulting for backoffice-uploaded Guia de ITBI.

Collapsing completed customer stages reduces noise and improves scan speed, but hides historical details by default. The expand button preserves access without making the tracker dense.

## When To Use vs Avoid

Use this design for the Registro/ITBI workflow because it has actor-specific responsibilities and document sequencing.

Avoid applying this behavior globally to all workflow documents. Certificate and Contract stages still need their own status and validation semantics.

Avoid adding mocks or local fake state. If an API field is missing, document the gap explicitly and stop before inventing a contract.

## Scalability

The design performs only local filtering and sorting over the stage document arrays already returned by the process detail endpoints. This is O(n) per stage and suitable for the expected small document counts per process.

No new list queries or per-document fan-out are introduced. Throughput remains bounded by the existing process detail query and at most one upload/status mutation sequence for the Guia de ITBI fallback path.

The document sequencing is deterministic:

1. Guia de ITBI exists and is viewable.
2. Customer sends Comprovante ITBI.
3. Backoffice approves Comprovante ITBI.
4. Matricula do imovel becomes visible or is shown when already returned by API.
