import { NextResponse } from 'next/server'

/**
 * Log the full error server-side but return a generic, non-revealing message to the
 * client. Returning raw `error.message` can leak internal details (DB error text,
 * stack traces, table/column names, even secrets) to callers — this centralises a
 * safe error response so no route accidentally does that.
 *
 * @param context short label for the server log (e.g. "Medications API")
 * @param error   the caught error (logged in full, never sent to the client)
 * @param status  HTTP status to return (defaults to 500)
 */
export function apiError(context: string, error: unknown, status = 500) {
  console.error(`[${context}]`, error)
  return NextResponse.json(
    { error: 'Đã xảy ra lỗi hệ thống, vui lòng thử lại.' },
    { status },
  )
}
