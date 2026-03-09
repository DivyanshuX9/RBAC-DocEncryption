import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 })

  const sql = getDb()
  const users = await sql`
    SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC
  `

  return NextResponse.json(users)
}

export async function PUT(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 })

  try {
    const { userId, role } = await request.json()
    const validRoles = ["admin", "teacher", "student", "office"]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const sql = getDb()
    await sql`UPDATE users SET role = ${role} WHERE id = ${userId}`

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 })

  try {
    const { userId } = await request.json()
    if (userId === user.userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    const sql = getDb()
    await sql`DELETE FROM users WHERE id = ${userId}`

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
