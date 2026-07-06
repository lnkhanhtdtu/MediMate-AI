import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import {
  buildInteractionReport,
  MAX_DRUGS_PER_CHECK,
  MAX_DRUG_NAME_LENGTH,
} from '@/services/drugInteraction'

// Internal JSON-RPC 2.0 tool endpoint used by the chat agent pipeline.
// It exposes the same `check_drug_interaction` tool as the public MCP server
// at /api/mcp-server/mcp (both share src/services/drugInteraction.ts), but
// this route additionally requires a Supabase session because it is called
// with the patient's auth cookie from inside /api/chat.

export async function POST(request: Request) {
  let id: unknown = null
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    id = body?.id
    const { method, params } = body

    // 2. List tools method
    if (method === 'tools/list') {
      return NextResponse.json({
        jsonrpc: '2.0',
        result: {
          tools: [
            {
              name: 'check_drug_interaction',
              description: 'Checks for potential drug-drug interactions or side effects between a list of medications using openFDA API data.',
              inputSchema: {
                type: 'object',
                properties: {
                  drugs: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                    description: 'An array of drug names (generic or brand name) to analyze, e.g. ["aspirin", "ibuprofen"].',
                  },
                },
                required: ['drugs'],
              },
            },
          ],
        },
        id,
      })
    }

    // 3. Call tool method
    if (method === 'tools/call') {
      const { name, arguments: args } = params

      if (name === 'check_drug_interaction') {
        const drugs: string[] = args?.drugs || []

        if (drugs.length < 2) {
          return NextResponse.json({
            jsonrpc: '2.0',
            result: {
              content: [
                {
                  type: 'text',
                  text: 'Vui lòng cung cấp ít nhất 2 loại thuốc để kiểm tra tương tác thuốc.',
                },
              ],
              isError: false,
            },
            id,
          })
        }

        // Limit the number of drugs to prevent DoS amplification
        if (drugs.length > MAX_DRUGS_PER_CHECK) {
          return NextResponse.json({
            jsonrpc: '2.0',
            result: {
              content: [
                {
                  type: 'text',
                  text: `Tối đa ${MAX_DRUGS_PER_CHECK} loại thuốc mỗi lần kiểm tra.`,
                },
              ],
              isError: true,
            },
            id,
          })
        }

        // Limit the length of drug names
        for (const drug of drugs) {
          if (typeof drug !== 'string' || drug.length > MAX_DRUG_NAME_LENGTH) {
            return NextResponse.json({
              jsonrpc: '2.0',
              error: {
                code: -32602,
                message: `Tên thuốc không hợp lệ hoặc quá dài (tối đa ${MAX_DRUG_NAME_LENGTH} ký tự).`
              },
              id
            })
          }
        }

        const reportText = await buildInteractionReport(drugs)

        return NextResponse.json({
          jsonrpc: '2.0',
          result: {
            content: [
              {
                type: 'text',
                text: reportText,
              },
            ],
            isError: false,
          },
          id,
        })
      }

      return NextResponse.json({
        jsonrpc: '2.0',
        error: {
          code: -32601,
          message: `Tool ${name} not found.`,
        },
        id,
      })
    }

    return NextResponse.json({
      jsonrpc: '2.0',
      error: {
        code: -32601,
        message: `Method ${method} not found.`,
      },
      id,
    })
  } catch (error) {
    console.error('MCP Server Route Error:', error)
    return NextResponse.json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal server error.',
      },
      id,
    })
  }
}
