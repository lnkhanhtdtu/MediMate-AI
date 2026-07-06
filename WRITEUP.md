# MediMate AI — Kaggle Writeup

> Copy each field below into the corresponding box in the Kaggle "New Writeup" form.
> Word count of the **Project Description** section is kept well under the 2,500-word limit.

---

## 1. Title  *(max 80 chars)*

**MediMate AI: A Fail-Safe Agent for Safe Medication Management**

*(56 characters)*

---

## 2. Subtitle / "Explain your project in one sentence"  *(max 140 chars)*

**An AI health agent that reads messy prescriptions, screens drugs against openFDA for dangerous interactions, and never saves an unsafe dose.**

*(139 characters)*

---

## 3. Card & Thumbnail Image  *(560 × 280)*

Use `public/cover_image.png` (crop/scale to 560 × 280). It shows the MediMate AI name/logo plus a condensed architecture strip (Chat/OCR → openFDA tool → interaction gate → schedule).

---

## 4. Submission Track

**Concierge Agents** — a safe, secure personal agent that simplifies a genuinely hard everyday task (managing complicated medications) while keeping personal health data protected.

---

## 5. Media Gallery

- **Cover image (required):** `public/cover_image.png`
- **Demo video (required, ≤ 5 min, YouTube):** *[paste YouTube link here]*
- **Screenshots to add:** (1) chat intake of a messy Vietnamese medication sentence, (2) an openFDA interaction warning blocking a save, (3) prescription-photo OCR result, (4) adherence dashboard, (5) Admin Portal.

---

## 6. Project Description  *(paste into the 2,500-word box)*

### The Problem

Medication non-adherence is one of the most expensive and dangerous problems in everyday healthcare. Older adults and people managing chronic conditions often juggle five, ten, or more prescriptions a day, each with its own dose, timing, and refill schedule. They forget doses, double-dose by accident, and — most dangerously — start a new medication that interacts badly with something they already take. The people most affected are frequently the least comfortable with complex apps: elderly patients who would rather *say* "uống nửa viên huyết áp buổi sáng" ("half a blood-pressure pill in the morning") than fill out a structured form, or who simply want to photograph the prescription the doctor handed them.

Existing reminder apps solve the *timing* problem but not the *safety* or *data-entry* problem. They assume the user can already translate a doctor's instructions into clean, structured records, and they do nothing to catch a dangerous drug combination before it is scheduled. MediMate AI targets exactly that gap.

### Why an Agent?

This problem is a strong fit for an agent rather than a form, because every step requires *reasoning over unstructured, real-world input and deciding what to do next*:

1. **Understanding messy natural language.** A patient types a run-on Vietnamese sentence with abbreviations, fractional doses ("nửa viên" = half a tablet), and implicit timing. A rigid parser fails; a reasoning agent extracts structured intent and, crucially, **knows when information is missing** and asks a targeted follow-up question instead of guessing.
2. **Reading images.** The same agent handles a photographed prescription via OCR, extracting the same structured fields.
3. **Deciding to use a tool.** Before saving, the agent must recognize that it needs external medical knowledge, call the drug-label tool, and *reason over the raw response* to judge whether a real interaction risk exists.
4. **Refusing to act when unsafe.** The agent must be able to *stop* — to withhold a database write and escalate to the user — rather than blindly completing the task.

That final property is the heart of the project: an agent that can decline to act is safer than automation that always succeeds.

### The Solution

MediMate AI is a conversational personal health agent. A patient can:

- **Chat** in natural Vietnamese or English to add medications, log doses ("I took my morning pill"), and ask questions.
- **Photograph a prescription** and have it parsed and scheduled automatically (OCR).
- **Track adherence** through a streak metric that only counts a day as "on track" when ≥ 80% of that day's scheduled doses were actually taken.

Behind the scenes, an **Admin Portal** (gated by a server-side email allowlist) gives a care coordinator system-wide adherence stats, per-patient drill-downs, and an emergency broadcast channel.

### Architecture — a fail-safe agentic pipeline

The core is a controlled, multi-stage agentic pipeline rather than a monolithic prompt:

```
User (chat text / prescription photo)
        │
        ▼
[Intake Agent]  ── Gemini extracts structured medication JSON;
        │           asks a follow-up if dosage/timing is missing
        ▼
[Retrieve current medications]  ── from Supabase (the patient's existing drugs)
        │
        ▼
[MCP-style tool call]  ── /api/mcp, a JSON-RPC 2.0 endpoint modeled on the
        │                 Model Context Protocol (tools/list, tools/call),
        ▼                 which queries the openFDA drug-label API
[Interaction Checker Agent]  ── Gemini reasons over the raw label data vs. the
        │                        patient's existing drugs
        ▼
[Safety Gate]  ── HIGH/MEDIUM risk (or an unparseable/failed check) → STOP and
        │          warn the user; only a clean result proceeds
        ▼
[Write to Supabase]  ── schedule the doses (RLS-protected)
```

The pipeline is implemented across Next.js App Router API routes: `/api/chat` (intake + orchestration + gate), `/api/mcp` (the JSON-RPC tool endpoint over openFDA), and `/api/stats`, `/api/logs`, `/api/medications`, `/api/admin`, `/api/broadcast` for the surrounding features. Persistence and auth are handled by Supabase (PostgreSQL) with tightened Row Level Security. The default model is Google's `gemini-3.1-flash-lite`, pinned to a single overridable constant so a model rename can be fixed via environment variable without redeploying code.

### The Build — an honest journey

We built MediMate AI with a spec-driven approach: an `architecture.md` was written first so the AI-assisted coding stayed grounded in a consistent data model and security design.

The most instructive part of the build was **what we deliberately did *not* ship**. Our original plan called for Google's ADK to manage the conversation lifecycle. In practice, version conflicts between the ADK packages and Next.js 16 broke the build repeatedly. Rather than fight the toolchain or misrepresent the result, we removed ADK entirely and implemented the conversation loop and context state directly in Next.js API routes and React client state. We are careful to describe the system accurately: it is a **controlled agentic pipeline**, and the tool server is a **JSON-RPC endpoint modeled on MCP** — not a full ADK multi-agent framework or a complete MCP server. That honesty is itself part of the engineering: the safety guarantees below are real precisely because we understood and controlled every stage ourselves.

### Security & Value

Because this app handles personal health information, safety is not a feature bolted on at the end — it is the design center. We applied HIPAA-inspired safeguards:

- **Auth on every user-facing route** via Supabase JWT session cookies; the MCP tool endpoint rejects anonymous access.
- **Tightened RLS** on `medication_logs`: the `INSERT` policy verifies ownership of *both* the log's `user_id` **and** the owner of the referenced `medication_id`, closing a cross-account log-injection hole.
- **No PHI in logs** — patient drug data is never written to server console output.
- **DoS limits** on the tool endpoint — at most 10 drugs per interaction check, drug names capped at 100 characters.
- **Server-side admin allowlist** — Admin access is decided by an `ADMIN_EMAILS` env allowlist checked on the server, replacing an earlier client-spoofable `email.includes('admin')` check.
- **Fail-safe interaction gate** — the defining safety property. If the interaction check errors out or returns something the agent cannot parse, the system **warns the user rather than silently recording the drug as safe.** An agent that fails closed, not open, is the right default for medicine.

The value is concrete: a patient who cannot fill out a structured form can still get their medications scheduled correctly from a photo or a sentence, and can be actively protected from a dangerous combination they had no way to know about — all while their data stays isolated per-account.

### Deployability

MediMate AI is deployed and publicly usable on Vercel at **https://medimate-ai-five.vercel.app/**, backed by hosted Supabase. Two 1-click demo accounts (admin and patient) let judges try the full flow without registering. Setup is fully reproducible from the repository README, including environment variables and database migrations.

### Course concepts demonstrated

- **Agent / agentic system** — the fail-safe intake → tool → interaction-checker → gate pipeline.
- **MCP** — a JSON-RPC 2.0 tool endpoint modeled on the Model Context Protocol, wrapping openFDA.
- **Security features** — auth, tightened RLS, DoS limits, PHI-safe logging, and the fail-safe write gate.
- **Deployability** — a live, reproducible Vercel deployment.

*(Word count of this Project Description: ~950 words — comfortably within the 2,500-word limit, leaving room to expand any section.)*

---

## 7. Attachments / Project Links

- **Live demo:** https://medimate-ai-five.vercel.app/
- **GitHub repository:** *[paste public repo URL]*
- **Demo video (YouTube):** *[paste YouTube link]*
- **Architecture doc:** `architecture.md` in the repository
