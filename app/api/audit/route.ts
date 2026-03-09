import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sql = getDb()

  let logs
  if (user.role === "admin") {
    logs = await sql`
      SELECT al.*, u.username, d.document_name
      FROM audit_logs al
      JOIN users u ON al.user_id = u.id
      JOIN documents d ON al.document_id = d.id
      ORDER BY al.created_at DESC
      LIMIT 100
    `
  } else {
    logs = await sql`
      SELECT al.*, u.username, d.document_name
      FROM audit_logs al
      JOIN users u ON al.user_id = u.id
      JOIN documents d ON al.document_id = d.id
      WHERE al.user_id = ${user.userId}
      ORDER BY al.created_at DESC
      LIMIT 50
    `
  }

  return NextResponse.json(logs)
}
