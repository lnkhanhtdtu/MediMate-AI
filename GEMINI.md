# MediMate AI — Gemini CLI Context

Read `AGENTS.md` first: this repo runs a Next.js version with breaking changes; consult `node_modules/next/dist/docs/` before writing any Next.js code.

## What this project is

A safety-first medication concierge agent (Kaggle Vibe Coding Capstone — Concierge Agents track). Core invariant: **the agent fails closed** — a medication is never saved when the drug-interaction check is high/medium risk, errored, or unparseable.

## Map for agents

- `src/app/api/chat/route.ts` — the agentic pipeline: Intake Agent (Gemini structured output) → tool call → Interaction Checker Agent → Safety Gate → Supabase write.
- `src/services/drugInteraction.ts` — shared openFDA tool logic (single source of truth).
- `src/app/api/mcp/route.ts` — internal JSON-RPC 2.0 tool endpoint (Supabase-authenticated).
- `src/app/api/mcp-server/[transport]/route.ts` — public spec-compliant MCP server (Streamable HTTP).
- `supabase/migrations/` — schema + RLS; run in order `00 → 07`.
- `architecture.md` — data model, adherence algorithm, security design.

## Rules for agents working here

1. Never weaken the Safety Gate in `/api/chat` — it must warn, not save, on any failed or risky interaction check.
2. Never log drug names or any patient data to the server console (PHI).
3. Every user-facing API route must authenticate via Supabase before touching data.
4. Keep the two tool transports (`/api/mcp`, `/api/mcp-server`) delegating to `src/services/drugInteraction.ts` — do not fork the logic.
5. No secrets in code — environment variables only (`.env.example` is the template).

Custom commands for this repo live in `.gemini/commands/` (e.g. `/safety:audit`, `/db:schema`, `/tool:check`).
