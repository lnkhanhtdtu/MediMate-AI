import { createMcpHandler } from 'mcp-handler'
import { z } from 'zod'
import {
  buildInteractionReport,
  MAX_DRUGS_PER_CHECK,
  MAX_DRUG_NAME_LENGTH,
} from '@/services/drugInteraction'

// Public, spec-compliant MCP server (Model Context Protocol) exposing the
// same `check_drug_interaction` tool the in-app agent pipeline uses.
//
// Transport: Streamable HTTP at POST /api/mcp-server/mcp — connectable from
// any MCP client, e.g.:
//   npx @modelcontextprotocol/inspector
//   → https://medimate-ai-five.vercel.app/api/mcp-server/mcp
//
// Security model: unlike the per-user API routes, this endpoint is
// intentionally anonymous. It touches NO patient data — it only proxies
// public openFDA drug-label documents — and the zod schema enforces the
// same DoS caps as the internal endpoint (≤10 drugs, names ≤100 chars),
// so an unauthenticated caller can learn nothing and amplify nothing.
const handler = createMcpHandler(
  (server) => {
    server.tool(
      'check_drug_interaction',
      'Checks for potential drug-drug interactions or side effects between a list of medications using official openFDA drug-label data. Returns the raw label excerpts (interactions + warnings) for an LLM to reason over.',
      {
        drugs: z
          .array(
            z
              .string()
              .min(1)
              .max(MAX_DRUG_NAME_LENGTH, `Drug names are capped at ${MAX_DRUG_NAME_LENGTH} characters.`)
          )
          .min(2, 'Provide at least 2 drugs to check for interactions.')
          .max(MAX_DRUGS_PER_CHECK, `At most ${MAX_DRUGS_PER_CHECK} drugs per check.`)
          .describe('Drug names (generic or brand) to analyze, e.g. ["warfarin", "aspirin"].'),
      },
      async ({ drugs }) => {
        const reportText = await buildInteractionReport(drugs)
        return {
          content: [{ type: 'text', text: reportText }],
        }
      }
    )
  },
  {
    serverInfo: {
      name: 'medimate-drug-safety',
      version: '1.0.0',
    },
  },
  {
    basePath: '/api/mcp-server',
    // SSE transport needs Redis for session state; Streamable HTTP (the
    // current MCP spec transport) is stateless-friendly, so we ship only it.
    disableSse: true,
    maxDuration: 30,
  }
)

export { handler as GET, handler as POST, handler as DELETE }
