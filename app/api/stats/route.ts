import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sql = getDb()

  const docCount = await sql`SELECT COUNT(*) as count FROM documents`
  const userCount = await sql`SELECT COUNT(*) as count FROM users`
  const auditCount = await sql`SELECT COUNT(*) as count FROM audit_logs`
  const verifiedCount = await sql`SELECT COUNT(*) as count FROM blockchain_records WHERE verified = true`

  const recentActivity = await sql`
    SELECT al.action, al.created_at, u.username, d.document_name
    FROM audit_logs al
    JOIN users u ON al.user_id = u.id
    JOIN documents d ON al.document_id = d.id
    ORDER BY al.created_at DESC
    LIMIT 5
  `

  const roleDistribution = await sql`
    SELECT role, COUNT(*) as count FROM users GROUP BY role
  `

  return NextResponse.json({
    documents: Number(docCount[0].count),
    users: Number(userCount[0].count),
    audit_entries: Number(auditCount[0].count),
    verified_documents: Number(verifiedCount[0].count),
    recent_activity: recentActivity,
    role_distribution: roleDistribution,
  })
}
