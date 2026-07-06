# 🏛️ System Architecture — MediMate AI

> 🇻🇳 Bản tiếng Việt: [architecture.vi.md](architecture.vi.md)

This document describes the software architecture, data model, core business flows (the intake/interaction-checking flow and the adherence calculation), and the medical-data security mechanisms of MediMate AI.

---

## 1. Architecture Overview

MediMate AI is built on the **Next.js App Router** combined with a **Backend-as-a-Service (Supabase) database security** model. All business logic is packaged as serverless API routes protected by the Supabase Auth middleware layer.

```mermaid
graph TD
    Client[Next.js Client UI] -->|1. Send message / OCR image| ChatAPI[/api/chat/]
    Client -->|4. Update dose taken| LogsAPI[/api/logs/]
    ChatAPI -->|2. Look up label data| MCP[/api/mcp — internal JSON-RPC/]
    MCP -->|Shared tool logic| Svc[services/drugInteraction.ts]
    MCPServer[/api/mcp-server/mcp — public MCP server/] -->|Shared tool logic| Svc
    Svc -->|External API call| OpenFDA[openFDA API]
    ExtClient[Any MCP client, e.g. MCP Inspector] -->|Streamable HTTP| MCPServer
    ChatAPI -->|3. Analyze interactions| Gemini[Google Gemini 3.1 Flash-Lite]
    ChatAPI -->|Save prescription| DB[(Supabase DB)]
    LogsAPI -->|Write adherence log| DB
```

---

## 2. Data Model (ERD)

Three RLS-protected tables in Supabase (PostgreSQL); full DDL in [`supabase/schema.sql`](supabase/schema.sql) and incremental history in `supabase/migrations/`:

```mermaid
erDiagram
    auth_users ||--o{ medications : "owns"
    auth_users ||--o{ medication_logs : "owns"
    auth_users |o--o{ broadcasts : "created_by (admin)"
    medications ||--o{ medication_logs : "generates (CASCADE)"

    medications {
        uuid id PK
        uuid user_id FK "auth.users, RLS owner"
        text name
        text dosage
        text frequency
        jsonb schedule "e.g. [08:00, 20:00]"
        text prescription_name
        numeric total_stock
        numeric remaining_stock
        numeric dosage_quantity "supports 0.5 tablet"
        timestamptz created_at
        timestamptz updated_at
    }

    medication_logs {
        uuid id PK
        uuid user_id FK "RLS: must own medication too"
        uuid medication_id FK
        timestamptz scheduled_time "UNIQUE with medication_id"
        timestamptz taken_at
        text status "taken | missed | scheduled"
        timestamptz created_at
    }

    broadcasts {
        uuid id PK
        text title
        text message
        text severity "info | warning | urgent"
        uuid created_by FK "SET NULL on delete"
        timestamptz created_at
    }
```

Integrity mechanisms beyond the columns:

- **Stock trigger** — `handle_medication_log_status_change()` decrements `remaining_stock` by `dosage_quantity` when a log flips to `taken` (and restores it when un-taken), clamped to `[0, total_stock]`.
- **Race guard** — unique index `(medication_id, scheduled_time)` prevents two concurrent page loads from generating duplicate daily logs.
- **Write path for broadcasts** — no user INSERT policy; rows are created only through the admin API using the service-role key.

---

## 3. Core Business Flows

### A. Add Medication & Interaction Check (Intake & Safe Interaction Checker)

When a user submits a request to add a new medication (via chat text or a prescription photo):

1. **Intake Agent**: Gemini extracts the medication fields (`name`, `dosage`, `frequency`, `schedule`, `total_stock`, `dosage_quantity`).
2. **Retrieve Current Drugs**: The system loads the patient's currently-taken medications from Supabase.
3. **MCP Query**:
   - The `/api/chat` route makes an internal POST call to the JSON-RPC tool endpoint `/api/mcp`.
   - The tool logic lives in `src/services/drugInteraction.ts` (shared with the public MCP server) and uses `AbortSignal.timeout(8000)` to query interaction data from the U.S. openFDA API.
4. **Interaction Checker Agent**:
   - Receives the raw label report from the tool endpoint.
   - Uses Gemini to analyze cross-interaction warnings between the new medication and the existing ones.
   - If a **High** or **Medium** risk interaction is detected, the system halts and returns a `WARNING_INTERACTION` response with guidance. The patient can cancel, or explicitly accept the risk to record the schedule.

### B. Adherence Streak Calculation

The real adherence rate is computed automatically via the `/api/stats` route and the `getComplianceStreak()` method:

- Scan all medication logs from the last 30 days.
- Group them by day (`YYYY-MM-DD` format).
- A day counts as **on track** when the ratio of doses actually taken (status `taken`) to the total doses scheduled that day is **≥ 80%**.
- The streak counts backwards from today (or from yesterday if today's doses aren't due yet, or if the day still has pending doses that keep the day from being decided).

---

### C. The Drug-Safety Tool — two transports, one implementation

The `check_drug_interaction` tool is implemented once in `src/services/drugInteraction.ts` and exposed through two transports:

| Transport | Route | Auth | Purpose |
|---|---|---|---|
| Internal JSON-RPC 2.0 (`tools/list` / `tools/call`) | `/api/mcp` | Supabase session cookie required | Called by the chat pipeline with the patient's auth context |
| **Public MCP server** (Model Context Protocol, Streamable HTTP via `@modelcontextprotocol/sdk` + `mcp-handler`) | `/api/mcp-server/mcp` | Anonymous by design | Lets any MCP client (e.g. MCP Inspector, Claude Desktop, Gemini CLI) call the same tool |

The public endpoint is safe to leave anonymous because it handles **no patient data** — it only proxies public openFDA label documents — and enforces the same DoS caps (≤ 10 drugs per check, drug names ≤ 100 characters) via its zod input schema.

---

## 4. Medical-Data Security Policy (HIPAA-inspired)

To protect personal health information, MediMate AI applies the following measures:

1. **Row Level Security (RLS) at the database level**:
   - The `medications` table only allows CRUD by the owner (`auth.uid() = user_id`).
   - The `medication_logs` table uses a tightened RLS `INSERT` policy that prevents cross-assigning a log to another user's medication:
     ```sql
     WITH CHECK (
         auth.uid() = user_id
         AND EXISTS (
             SELECT 1 FROM public.medications
             WHERE id = medication_id AND user_id = auth.uid()
         )
     )
     ```
2. **Protecting the tool endpoints**:
   - `/api/mcp` (the internal transport used by the agent pipeline) requires an authenticated user via the Supabase Auth session cookie forwarded from `/api/chat`. Anonymous access is fully blocked.
   - `/api/mcp-server/mcp` (the public MCP server) is intentionally anonymous but exposes **only public openFDA data** — never patient data — with schema-enforced DoS caps.
3. **No PHI leakage**:
   - Patient medical data is never written to server console logs (e.g. no `console.log` of prescription data or dose-log details).

---

## 5. Admin Panel Layout & RBAC

Access control is based on an **email allowlist** configured via the `ADMIN_EMAILS` environment variable and checked entirely server-side (it cannot be spoofed from the client).

- **Admin API (`/api/admin/users`)**: Instantiates a Supabase client with the `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS, gather system-wide statistics, and list users along with their real adherence streaks.
- **Honest empty state**: If the server has no `SUPABASE_SERVICE_ROLE_KEY`, the API returns an empty state with configuration guidance — it does **not** fabricate fake patient data, to avoid misleading reviewers.
