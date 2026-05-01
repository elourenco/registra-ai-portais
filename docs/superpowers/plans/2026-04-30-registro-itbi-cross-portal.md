# Registro/ITBI Cross-Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Registro/ITBI flow adjustments across backoffice, supplier, and customer portals without creating a parallel workflow state machine.

**Architecture:** Keep `stage.process.documents` and the buyer process snapshot as the source of truth. Apply actor-specific presentation rules at each portal boundary: backoffice can upload/validate, supplier is read-only for Registro documents, and customer can view backoffice documents while uploading only customer-owned pending documents.

**Tech Stack:** React 19, TypeScript, Vite, TanStack Query, Zod, pnpm workspaces, shadcn-style `@registra/ui`, shared workflow constants in `@registra/shared`.

---

## Preconditions

- Execute this plan from an isolated branch or git worktree, not directly on `main`.
- Keep the original design spec available at `docs/superpowers/specs/2026-04-30-registro-itbi-cross-portal-design.md`.
- If the local API is running, validate OpenAPI at `http://localhost:3000/docs.json`; if `localhost` fails, try `http://127.0.0.1:3000/docs.json`.

## File Structure

- Modify `apps/portal-backoffice/src/features/processes/api/document-validation-api.ts`
  - Add optional upload `status` support and normalize the upload response enough to auto-approve Guia de ITBI when the API returns a document id.
- Modify `apps/portal-backoffice/src/features/processes/components/api-process-detail-view.tsx`
  - Upload Guia de ITBI with `approved` status and patch to `approved` when a returned document id is available.
- Modify `apps/portal-backoffice/src/features/processes/components/process-stage-card.tsx`
  - Hide the status selector for Guia de ITBI and show read-only approved presentation after upload.
- Modify `apps/portal-supplier/src/features/developments/pages/development-buyer-detail-page.tsx`
  - Render Registro as vertical operational subcards and make `Documentos da etapa` a view-only list.
- Modify `apps/portal-customer/src/features/buyer-onboarding/api/buyer-process-api.ts`
  - Add authenticated document download helper for tracker view actions.
- Modify `apps/portal-customer/src/features/buyer-onboarding/core/buyer-process-response.ts`
  - Normalize Registro document labels and change the post-ITBI pending document from buyer-uploaded deed to backoffice-owned Matricula do imovel.
- Modify `apps/portal-customer/src/features/buyer-process-tracker/buyer-process-tracker.tsx`
  - Wire authenticated document viewing into the tracker.
- Modify `apps/portal-customer/src/features/buyer-process-tracker/components/status-tracker-card.tsx`
  - Collapse completed stages by default, highlight the in-progress stage, normalize Registro labels, and show view/upload actions according to ownership.

---

### Task 1: Validate API Contract For Document Upload And Download

**Files:**
- Read: `docs/superpowers/specs/2026-04-30-registro-itbi-cross-portal-design.md`
- Read: remote/local OpenAPI from `http://localhost:3000/docs.json` or `http://127.0.0.1:3000/docs.json`

- [ ] **Step 1: Inspect document endpoints in OpenAPI**

Run:

```bash
node -e 'const http=require("http");const urls=["http://localhost:3000/docs.json","http://127.0.0.1:3000/docs.json"];function get(url){return new Promise((resolve,reject)=>http.get(url,res=>{let d="";res.on("data",c=>d+=c);res.on("end",()=>resolve({url,status:res.statusCode,body:d}));}).on("error",reject));}(async()=>{let last;for(const url of urls){try{last=await get(url);if(last.status===200)break;}catch(e){last={url,error:e.message};}}if(!last||last.status!==200){console.error(JSON.stringify(last,null,2));process.exit(1);}const doc=JSON.parse(last.body);const out={source:last.url,postDocuments:doc.paths?.["/api/v1/documents"]?.post,patchStatus:doc.paths?.["/api/v1/documents/{documentId}/status"]?.patch,download:doc.paths?.["/api/v1/documents/{documentId}/download"]?.get,schemas:{ProcessDocumentResponse:doc.components?.schemas?.ProcessDocumentResponse,DocumentListResponse:doc.components?.schemas?.DocumentListResponse}};console.log(JSON.stringify(out,null,2));})();'
```

Expected:

- Output includes `postDocuments`, `patchStatus`, and `download`.
- If the command fails because the API is not running, continue with the resilient implementation in Task 2 and explicitly mention in the final verification that live OpenAPI was unavailable.

- [ ] **Step 2: Confirm status upload support before coding**

Check the `postDocuments.requestBody` output from Step 1.

Expected:

- If the schema includes `status`, Task 2 sends `status: "approved"` in the upload form.
- If the schema does not include `status`, Task 2 still sends `status: "approved"` as a harmless multipart field and also patches the returned document id to `approved` when the response exposes one.

- [ ] **Step 3: Commit no code for validation-only task**

Run:

```bash
git status --short
```

Expected:

- No source changes from Task 1.

---

### Task 2: Backoffice Auto-Approves Guia De ITBI And Hides Its Status Control

**Files:**
- Modify: `apps/portal-backoffice/src/features/processes/api/document-validation-api.ts`
- Modify: `apps/portal-backoffice/src/features/processes/components/api-process-detail-view.tsx`
- Modify: `apps/portal-backoffice/src/features/processes/components/process-stage-card.tsx`

- [ ] **Step 1: Extend backoffice upload API to accept status and return a normalized document id**

In `apps/portal-backoffice/src/features/processes/api/document-validation-api.ts`, replace `UploadWorkflowDocumentInput` and `uploadWorkflowDocument` with this shape while preserving existing exports:

```ts
export type UploadWorkflowDocumentInput = {
  token: string;
  processId: string;
  block: string;
  type: string;
  uploadedBy: string;
  status?: WorkflowProcessDocumentStatus;
  file: File;
};

export type UploadWorkflowDocumentResult = {
  documentId: string | null;
  status: WorkflowProcessDocumentStatus | null;
  raw: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function pickText(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(Math.trunc(value));
    }
  }

  return null;
}

function normalizeWorkflowDocumentStatus(
  value: unknown,
): WorkflowProcessDocumentStatus | null {
  const normalized = pickText(value)?.toLowerCase();

  switch (normalized) {
    case "uploaded":
    case "under_review":
    case "approved":
    case "rejected":
    case "replaced":
      return normalized;
    default:
      return null;
  }
}

function normalizeUploadWorkflowDocumentResult(response: unknown): UploadWorkflowDocumentResult {
  const root = isRecord(response) ? response : {};
  const data = isRecord(root.data) ? root.data : null;
  const document = isRecord(root.document) ? root.document : null;
  const item = isRecord(root.item) ? root.item : null;
  const source = document ?? item ?? data ?? root;

  return {
    documentId: pickText(source.id, source.documentId),
    status: normalizeWorkflowDocumentStatus(source.status),
    raw: response,
  };
}

export async function uploadWorkflowDocument({
  token,
  processId,
  block,
  type,
  uploadedBy,
  status,
  file,
}: UploadWorkflowDocumentInput): Promise<UploadWorkflowDocumentResult> {
  const formData = new FormData();
  formData.set("processId", processId);
  formData.set("block", block);
  formData.set("type", type);
  formData.set("uploadedBy", uploadedBy);
  if (status) {
    formData.set("status", status);
  }
  formData.set("file", file);

  const response = await apiRequest<unknown>("/api/v1/documents", {
    token,
    method: "POST",
    body: formData,
  });

  return normalizeUploadWorkflowDocumentResult(response);
}
```

- [ ] **Step 2: Auto-approve Guia de ITBI after backoffice upload**

In `apps/portal-backoffice/src/features/processes/components/api-process-detail-view.tsx`, change the shared import at the top from type-only to include `REGISTRATION_DOCUMENT_TYPES`:

```ts
import { REGISTRATION_DOCUMENT_TYPES, type RegistrationDocumentType } from "@registra/shared";
```

Then replace the current `uploadDocumentMutation` with:

```ts
const uploadDocumentMutation = useMutation({
  mutationFn: async (input: Parameters<typeof uploadWorkflowDocument>[0]) => {
    const result = await uploadWorkflowDocument(input);

    if (
      input.type === REGISTRATION_DOCUMENT_TYPES.itbiGuide &&
      result.documentId &&
      result.status !== "approved"
    ) {
      await patchDocumentValidationStatus({
        token: input.token,
        documentId: result.documentId,
        status: "approved",
      });
    }

    return result;
  },
  onSuccess: async () => {
    toast({
      title: "Documento enviado",
      description: "O documento foi vinculado à etapa do processo.",
    });
    await queryClient.invalidateQueries({ queryKey: ["processes", "detail"] });
    await onRefetch();
  },
});
```

Then update `handleUploadRegistrationDocument` so Guia de ITBI sends status `approved`:

```ts
uploadDocumentMutation.mutate({
  token: session.token,
  processId: input.processId,
  block: "registration",
  type: input.type,
  uploadedBy: "backoffice",
  status: input.type === REGISTRATION_DOCUMENT_TYPES.itbiGuide ? "approved" : undefined,
  file: input.file,
});
```

- [ ] **Step 3: Hide the Guia de ITBI status selector in the backoffice card**

In `apps/portal-backoffice/src/features/processes/components/process-stage-card.tsx`, inside `renderDocumentCard`, add this local constant immediately after the existing `const statusOptions = document ? selectableStatusesForDocument(document.status) : [];` line:

```ts
const isItbiGuideDocument = document?.type === REGISTRATION_DOCUMENT_TYPES.itbiGuide;
```

Then change `canChangeStatus` to:

```ts
const canChangeStatus =
  Boolean(document) &&
  !isItbiGuideDocument &&
  !isCompletedStage &&
  Boolean(onPatchDocument) &&
  !busy;
```

Then replace the status `<Select>` block inside the `document ? (...)` branch with conditional rendering:

```tsx
{isItbiGuideDocument ? (
  <div className="flex min-w-0 flex-col gap-1 sm:min-w-[10rem]">
    <span className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
      Validação
    </span>
    <div className="flex h-9 items-center">
      <Badge variant="success">Aprovado</Badge>
    </div>
  </div>
) : (
  <div className="flex min-w-0 flex-1 flex-col gap-1 sm:min-w-[12rem]">
    <span className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
      Status
    </span>
    <Select
      aria-label={`Status do documento ${title}`}
      className="h-9 w-full min-w-0 bg-background text-left text-sm"
      value={document.status}
      disabled={!canChangeStatus}
      onChange={(event) => {
        const next = event.target.value as WorkflowProcessDocumentStatus;
        if (next === document.status || !onPatchDocument) {
          return;
        }

        onPatchDocument({
          documentId: document.id,
          status: next,
          comments: observation.trim() || undefined,
        });
      }}
    >
      {statusOptions.map((value) => (
        <option key={value} value={value}>
          {WORKFLOW_DOCUMENT_STATUS_LABEL[value]}
        </option>
      ))}
    </Select>
  </div>
)}
```

- [ ] **Step 4: Typecheck backoffice**

Run:

```bash
pnpm --filter @registra/portal-backoffice typecheck
```

Expected:

- Command exits with code 0.

- [ ] **Step 5: Commit backoffice changes**

Run:

```bash
git add apps/portal-backoffice/src/features/processes/api/document-validation-api.ts apps/portal-backoffice/src/features/processes/components/api-process-detail-view.tsx apps/portal-backoffice/src/features/processes/components/process-stage-card.tsx
git commit -m "fix: approve backoffice itbi guide uploads"
```

Expected:

- Commit succeeds with only the three backoffice files staged.

---

### Task 3: Supplier Registro Card Becomes A Vertical Read-Only Document List

**Files:**
- Modify: `apps/portal-supplier/src/features/developments/pages/development-buyer-detail-page.tsx`

- [ ] **Step 1: Add Registro helpers near the existing stage helpers**

In `apps/portal-supplier/src/features/developments/pages/development-buyer-detail-page.tsx`, add `REGISTRATION_BLOCK` to the top imports from `@registra/shared` only if it is not already imported elsewhere. The page currently imports no shared workflow constants directly, so add:

```ts
import { REGISTRATION_BLOCK } from "@registra/shared";
```

Then add this helper below `isContractStage`:

```ts
function isRegistrationStage(stage: SupplierWorkflowStage) {
  return stage.order === 3 || /registro/i.test(stage.name);
}

function getStageDocumentsForDisplay(stage: SupplierWorkflowStage) {
  const documents = stage.process?.documents ?? [];

  if (!isRegistrationStage(stage)) {
    return documents;
  }

  return documents.filter((document) => document.block === REGISTRATION_BLOCK);
}
```

- [ ] **Step 2: Use the Registro helper in the stage render loop**

Inside `processDetail.stages.map((stage) => {`, replace:

```ts
const documents = stage.process?.documents ?? [];
const isContract = isContractStage(stage);
```

with:

```ts
const documents = getStageDocumentsForDisplay(stage);
const isContract = isContractStage(stage);
const isRegistration = isRegistrationStage(stage);
```

- [ ] **Step 3: Make Registro subcards vertical**

Replace the grid class expression:

```tsx
<div
  className={`grid gap-4 ${isContract ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}
>
```

with:

```tsx
<div
  className={`grid gap-4 ${
    isContract ? "lg:grid-cols-2" : isRegistration ? "" : "lg:grid-cols-3"
  }`}
>
```

Expected:

- Contract keeps its current two-column treatment.
- Registro uses vertical stacked subcards.
- Other stages keep the current three-column layout.

- [ ] **Step 4: Render Registro documents as view-only list items**

In the non-contract `Documentos da etapa` subcard, replace the `documents.map((document) => (` item body with this conditional item layout:

```tsx
{documents.map((document) => (
  <div
    key={document.id}
    className="rounded-lg border border-border/60 px-3 py-3"
  >
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-foreground">
          {getSupplierWorkflowDocumentTypeLabel(document.type)}
        </p>
        <p className="type-caption text-muted-foreground">
          {document.originalFileName ?? "Arquivo sem nome"} • v{document.version} •{" "}
          {formatFileSize(document.fileSize)}
        </p>
        <p className="type-caption text-muted-foreground">
          Enviado por {document.uploadedBy ?? "-"} em {formatDateTime(document.createdAt)}
        </p>
        {document.metadata.deedRegistrationNumber ? (
          <p className="type-caption font-medium text-emerald-700">
            Matrícula registrada: {document.metadata.deedRegistrationNumber}
          </p>
        ) : null}
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0 self-end sm:self-auto"
        aria-label={`Visualizar ${getSupplierWorkflowDocumentTypeLabel(document.type)}`}
        onClick={() => {
          window.open(
            getDocumentDownloadUrl(document.id),
            "_blank",
            "noopener,noreferrer",
          );
        }}
      >
        <EyeIcon className="h-4 w-4" />
      </Button>
    </div>

    {!isRegistration ? (
      <div className="mt-3">
        <Badge variant={document.status === "approved" ? "success" : "secondary"}>
          {document.status}
        </Badge>
      </div>
    ) : null}
  </div>
))}
```

Expected:

- Registro documents show only document information and the view button.
- Non-Registro stages keep a passive status badge, preserving existing read-only context outside Registro.

- [ ] **Step 5: Typecheck supplier**

Run:

```bash
pnpm --filter @registra/portal-supplier typecheck
```

Expected:

- Command exits with code 0.

- [ ] **Step 6: Commit supplier changes**

Run:

```bash
git add apps/portal-supplier/src/features/developments/pages/development-buyer-detail-page.tsx
git commit -m "fix: align supplier registration documents card"
```

Expected:

- Commit succeeds with only the supplier page staged.

---

### Task 4: Customer Snapshot Shows Correct Registro Document Sequence

**Files:**
- Modify: `apps/portal-customer/src/features/buyer-onboarding/core/buyer-process-response.ts`

- [ ] **Step 1: Recognize both deed and registered deed documents**

In `withRegistrationPendingDocuments`, replace:

```ts
const deed = findRegistrationDocument(REGISTRATION_DOCUMENT_TYPES.deed);
```

with:

```ts
const deed = findRegistrationDocument(REGISTRATION_DOCUMENT_TYPES.deed);
const registeredDeed = findRegistrationDocument(REGISTRATION_DOCUMENT_TYPES.registeredDeed);
```

- [ ] **Step 2: Replace buyer pending deed with backoffice pending Matricula do imovel**

Still inside `withRegistrationPendingDocuments`, replace the existing block:

```ts
if (itbiReceipt?.status === "approved" && !deed) {
  nextDocuments.push({
    id: "pending-deed",
    title: REGISTRATION_DOCUMENT_TYPE_LABELS.deed,
    type: REGISTRATION_DOCUMENT_TYPES.deed,
    block: REGISTRATION_BLOCK,
    stageId: registrationStageId,
    stageTitle: registrationStageTitle,
    uploadedBy: "buyer",
    owner: "buyer",
    status: "pending",
    fileName: null,
    fileType: null,
    fileSizeKb: null,
    previewUrl: null,
    rejectionReason: null,
    metadata: {},
    createdAt: null,
  });
}
```

with:

```ts
if (itbiReceipt?.status === "approved" && !deed && !registeredDeed) {
  nextDocuments.push({
    id: "pending-registered-deed",
    title: REGISTRATION_DOCUMENT_TYPE_LABELS.registered_deed,
    type: REGISTRATION_DOCUMENT_TYPES.registeredDeed,
    block: REGISTRATION_BLOCK,
    stageId: registrationStageId,
    stageTitle: registrationStageTitle,
    uploadedBy: "backoffice",
    owner: "backoffice",
    status: "pending",
    fileName: null,
    fileType: null,
    fileSizeKb: null,
    previewUrl: null,
    rejectionReason: null,
    metadata: {},
    createdAt: null,
  });
}
```

Expected:

- Customer no longer gets a buyer-upload action for `deed`.
- The final pending card is owned by backoffice and therefore view-only/actionless until the API returns the uploaded document.

- [ ] **Step 3: Typecheck customer normalizer**

Run:

```bash
pnpm --filter @registra/portal-customer typecheck
```

Expected:

- Command exits with code 0.

- [ ] **Step 4: Commit customer sequence change**

Run:

```bash
git add apps/portal-customer/src/features/buyer-onboarding/core/buyer-process-response.ts
git commit -m "fix: adjust customer registration document sequence"
```

Expected:

- Commit succeeds with only the customer normalizer staged.

---

### Task 5: Customer Tracker Supports Document Viewing And Stage Collapse

**Files:**
- Modify: `apps/portal-customer/src/features/buyer-onboarding/api/buyer-process-api.ts`
- Modify: `apps/portal-customer/src/features/buyer-process-tracker/buyer-process-tracker.tsx`
- Modify: `apps/portal-customer/src/features/buyer-process-tracker/components/status-tracker-card.tsx`

- [ ] **Step 1: Add authenticated document viewing helper to customer API**

In `apps/portal-customer/src/features/buyer-onboarding/api/buyer-process-api.ts`, add this import:

```ts
import { portalConfig } from "@/shared/config/portal-config";
```

Then add this constant after imports:

```ts
const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
```

Then append this function to the file:

```ts
export async function openBuyerDocumentInBrowser(params: {
  token: string;
  documentId: string;
}): Promise<void> {
  const response = await fetch(
    `${apiBaseUrl}/api/v1/documents/${encodeURIComponent(params.documentId)}/download`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${params.token}`,
        Accept: "application/pdf,image/*,application/octet-stream,*/*",
        "x-portal": portalConfig.role,
      },
    },
  );

  if (!response.ok) {
    const message =
      response.status === 404
        ? "Documento não encontrado."
        : "Não foi possível carregar o documento.";
    throw new Error(message);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const newWindow = window.open(objectUrl, "_blank", "noopener,noreferrer");

  if (!newWindow) {
    URL.revokeObjectURL(objectUrl);
    throw new Error("Permita pop-ups para visualizar o documento.");
  }

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120_000);
}
```

- [ ] **Step 2: Wire document viewing mutation in tracker container**

In `apps/portal-customer/src/features/buyer-process-tracker/buyer-process-tracker.tsx`, change the API import:

```ts
import {
  openBuyerDocumentInBrowser,
  uploadBuyerDocument,
} from "../buyer-onboarding/api/buyer-process-api";
```

Then add this mutation after `uploadDocumentMutation`:

```ts
const viewDocumentMutation = useMutation({
  mutationFn: async ({ documentId }: { documentId: string }) => {
    if (!session?.token) {
      throw new Error("Sessão inválida para visualizar o documento.");
    }

    await openBuyerDocumentInBrowser({
      token: session.token,
      documentId,
    });
  },
});
```

Then pass these props to `StatusTrackerCard`:

```tsx
onViewDocument={(document) => viewDocumentMutation.mutateAsync({ documentId: document.id })}
viewingDocumentId={
  viewDocumentMutation.isPending ? (viewDocumentMutation.variables?.documentId ?? null) : null
}
viewErrorMessage={
  viewDocumentMutation.isError
    ? getApiErrorMessage(viewDocumentMutation.error, "Não foi possível visualizar o documento.")
    : null
}
```

- [ ] **Step 3: Extend tracker card props**

In `apps/portal-customer/src/features/buyer-process-tracker/components/status-tracker-card.tsx`, update imports to include labels and icons:

```ts
import {
  type BuyerProcessDocument,
  REGISTRATION_BLOCK,
  REGISTRATION_DOCUMENT_TYPE_LABELS,
  REGISTRATION_DOCUMENT_TYPES,
  isRegistrationDocumentType,
} from "@registra/shared";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChevronDownIcon,
  ChevronUpIcon,
  CircleCheckBigIcon,
  CircleDotIcon,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EyeIcon,
  Input,
  Label,
  Progress,
  UploadCloudIcon,
} from "@registra/ui";
import { useEffect, useState } from "react";
```

Then extend `StatusTrackerCardProps`:

```ts
onViewDocument: (document: BuyerProcessDocument) => Promise<void>;
viewingDocumentId?: string | null;
viewErrorMessage?: string | null;
```

Add these props to the component destructuring:

```ts
onViewDocument,
viewingDocumentId,
viewErrorMessage,
```

- [ ] **Step 4: Add document label and action helpers**

In `status-tracker-card.tsx`, add these helpers above `StatusTrackerCard`:

```ts
function getDocumentDisplayLabel(document: BuyerProcessDocument) {
  if (document.type && isRegistrationDocumentType(document.type)) {
    return REGISTRATION_DOCUMENT_TYPE_LABELS[document.type];
  }

  return document.title || document.type || "Documento";
}

function isSyntheticPendingDocument(document: BuyerProcessDocument) {
  return document.id.startsWith("pending-");
}

function canViewDocument(document: BuyerProcessDocument) {
  return !isSyntheticPendingDocument(document) && document.status !== "pending";
}
```

Then replace `canShowUploadAction` with:

```ts
function canShowUploadAction(document: BuyerProcessDocument) {
  if (document.owner === "backoffice") {
    return false;
  }

  if (document.status === "approved" || document.status === "under_review") {
    return false;
  }

  if (document.block !== REGISTRATION_BLOCK) {
    return true;
  }

  return document.type === REGISTRATION_DOCUMENT_TYPES.itbiReceipt;
}
```

- [ ] **Step 5: Collapse completed stages and highlight current stage**

Inside `StatusTrackerCard`, add state after `const topStatus = topStatusMap[status];`:

```ts
const [expandedStageIds, setExpandedStageIds] = useState<Set<string>>(new Set());

useEffect(() => {
  setExpandedStageIds(
    new Set(timeline.filter((stage) => stage.status !== "completed").map((stage) => stage.id)),
  );
}, [timeline]);
```

Inside `timeline.map`, add:

```ts
const isExpanded = expandedStageIds.has(stage.id);
const isCompleted = stage.status === "completed";
const isCurrent = stage.status === "in_progress";
```

Replace the stage wrapper className with:

```tsx
className={
  isCurrent
    ? "rounded-xl border border-primary/40 bg-primary/5 p-5 shadow-sm transition-colors"
    : "rounded-xl border border-slate-200/80 bg-background p-5 shadow-sm transition-colors"
}
```

In the stage header action area, add the expand/collapse button for completed cards:

```tsx
{isCompleted ? (
  <Button
    type="button"
    size="icon"
    variant="ghost"
    className="h-8 w-8 text-muted-foreground hover:text-foreground"
    aria-label={isExpanded ? "Recolher etapa" : "Expandir etapa"}
    title={isExpanded ? "Recolher etapa" : "Expandir etapa"}
    onClick={() =>
      setExpandedStageIds((current) => {
        const next = new Set(current);
        if (next.has(stage.id)) {
          next.delete(stage.id);
        } else {
          next.add(stage.id);
        }
        return next;
      })
    }
  >
    {isExpanded ? (
      <ChevronUpIcon className="h-4 w-4" aria-hidden />
    ) : (
      <ChevronDownIcon className="h-4 w-4" aria-hidden />
    )}
  </Button>
) : null}
```

Then update the existing stage body condition so the current content renders only when the stage is expanded:

```tsx
{isExpanded && (index === 0 || stageDocuments.length > 0 || isRegistrationStage(stage)) && (
  <div className="mt-6 space-y-6">
    {index === 0 ? (
      hasEnotariadoCertificate ? (
        <div className="flex gap-3 rounded-lg border border-emerald-200/80 bg-emerald-50/80 p-3 text-sm text-emerald-900">
          <CircleCheckBigIcon
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
            aria-hidden
          />
          <div>
            <p className="font-medium">Certificado eNotariado confirmado</p>
            <p className="text-emerald-800/90">
              O comprador possui certificado eNotariado registrado neste processo.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 rounded-lg border border-amber-200/80 bg-amber-50/80 p-3 text-sm text-amber-950">
          <CircleDotIcon
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
            aria-hidden
          />
          <div>
            <p className="font-medium">Atenção: certificado eNotariado</p>
            <p className="text-amber-900/90">
              O comprador ainda não possui certificado eNotariado.
            </p>
          </div>
        </div>
      )
    ) : null}

    <div className="space-y-3">
      <p className="text-sm font-medium">Documentos para análise</p>
      {stageDocuments.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/80 p-4 text-sm text-muted-foreground text-center">
          Nenhum documento vinculado a esta etapa.
        </p>
      ) : (
        <ul className="space-y-3">
          {stageDocuments.map((doc) => (
            <li
              key={doc.id}
              className="rounded-lg border border-border/80 bg-muted/10 p-4 text-sm"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-medium leading-snug">{getDocumentDisplayLabel(doc)}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.createdAt
                      ? `Enviado em ${new Date(doc.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                      : "Data de envio não informada"}
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:w-auto lg:min-w-[min(100%,22rem)] lg:flex-none">
                  {canViewDocument(doc) ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full shrink-0 sm:w-auto"
                      disabled={viewingDocumentId === doc.id}
                      onClick={() => void onViewDocument(doc)}
                    >
                      <EyeIcon className="mr-2 h-4 w-4" />
                      {viewingDocumentId === doc.id ? "Abrindo..." : "Visualizar"}
                    </Button>
                  ) : null}

                  {canShowUploadAction(doc) && (
                    <DocumentActionModal
                      document={doc}
                      onResolveNow={onResolveNow}
                      onUploadDocument={onUploadDocument}
                      uploading={uploadingDocumentId === doc.id}
                    />
                  )}

                  <div className="flex min-w-0 flex-col gap-1 items-start sm:items-end sm:min-w-[10rem]">
                    <span className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                      Status da validação
                    </span>
                    <div className="flex h-9 items-center justify-start sm:justify-end w-full">
                      <DocumentStatusBadge status={doc.status} />
                    </div>
                  </div>
                </div>
              </div>

              {doc.rejectionReason && doc.status === "rejected" && (
                <p className="mt-3 rounded border border-destructive/20 bg-destructive/5 p-2 text-xs text-destructive font-medium">
                  {doc.rejectionReason}
                </p>
              )}
              {doc.metadata?.deedRegistrationNumber ? (
                <p className="mt-3 rounded border border-emerald-200 bg-emerald-50 p-2 text-xs font-medium text-emerald-800">
                  Matrícula registrada: {doc.metadata.deedRegistrationNumber}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 6: Normalize customer document labels and add view button**

In the document list item, replace:

```tsx
<p className="font-medium leading-snug">{doc.type || doc.title}</p>
```

with:

```tsx
<p className="font-medium leading-snug">{getDocumentDisplayLabel(doc)}</p>
```

Then in the action area before `DocumentActionModal`, add:

```tsx
{canViewDocument(doc) ? (
  <Button
    type="button"
    size="sm"
    variant="outline"
    className="w-full shrink-0 sm:w-auto"
    disabled={viewingDocumentId === doc.id}
    onClick={() => void onViewDocument(doc)}
  >
    <EyeIcon className="mr-2 h-4 w-4" />
    {viewingDocumentId === doc.id ? "Abrindo..." : "Visualizar"}
  </Button>
) : null}
```

Also render `viewErrorMessage` next to upload errors in the top card:

```tsx
{viewErrorMessage ? (
  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
    {viewErrorMessage}
  </div>
) : null}
```

- [ ] **Step 7: Typecheck customer**

Run:

```bash
pnpm --filter @registra/portal-customer typecheck
```

Expected:

- Command exits with code 0.

- [ ] **Step 8: Commit customer tracker changes**

Run:

```bash
git add apps/portal-customer/src/features/buyer-onboarding/api/buyer-process-api.ts apps/portal-customer/src/features/buyer-process-tracker/buyer-process-tracker.tsx apps/portal-customer/src/features/buyer-process-tracker/components/status-tracker-card.tsx
git commit -m "fix: improve customer registration tracker"
```

Expected:

- Commit succeeds with only the customer tracker/API files staged.

---

### Task 6: Final Verification

**Files:**
- Read: all modified files from Tasks 2-5

- [ ] **Step 1: Run full typecheck**

Run:

```bash
pnpm typecheck
```

Expected:

- Command exits with code 0.

- [ ] **Step 2: Run impacted app builds**

Run:

```bash
pnpm --filter @registra/portal-backoffice build
pnpm --filter @registra/portal-supplier build
pnpm --filter @registra/portal-customer build
```

Expected:

- All three commands exit with code 0.

- [ ] **Step 3: Run lint**

Run:

```bash
pnpm lint
```

Expected:

- Command exits with code 0.

- [ ] **Step 4: Inspect final diff**

Run:

```bash
git status --short
git log --oneline -5
```

Expected:

- `git status --short` is empty.
- Recent commits include the task commits from this plan.

- [ ] **Step 5: Manual browser verification when credentials/data are available**

Run the relevant dev servers as needed:

```bash
pnpm dev:backoffice
pnpm dev:supplier
pnpm dev:customer
```

Expected manual results:

- Backoffice process detail: Guia de ITBI upload area shows no status selector after a guide exists; existing guide presents `Visualizar` and approved read-only state.
- Supplier buyer detail: Registro do imovel subcards are vertical; `Documentos da etapa` is a list; each document exposes only `Visualizar`.
- Customer tracker: completed cards start collapsed and can expand; the current card is highlighted; `Guia de ITBI` label is readable and viewable; `Comprovante ITBI` is the customer pending action; Matricula do imovel appears only after Comprovante ITBI approval or when returned by API.

- [ ] **Step 6: Final commit only if verification required fixups**

If Task 6 required code fixes, commit them:

```bash
git add apps/portal-backoffice apps/portal-supplier apps/portal-customer packages/shared
git commit -m "fix: finalize registro itbi portal flow"
```

Expected:

- Skip this step if there are no fixups.
- If run, commit contains only verification fixups.
