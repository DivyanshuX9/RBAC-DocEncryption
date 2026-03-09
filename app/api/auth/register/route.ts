import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { createAccessToken, createRefreshToken, hashPassword } from "@/lib/auth"
import type { UserRole } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const { username, email, password, role } = await request.json()

    if (!username || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const validRoles: UserRole[] = ["admin", "teacher", "student", "office"]
    const userRole = validRoles.includes(role) ? role : "student"

    const sql = getDb()

    const existing = await sql`SELECT id FROM users WHERE username = ${username} OR email = ${email}`
    if (existing.length > 0) {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 409 })
    }

    const passwordHash = hashPassword(password)

    const result = await sql`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (${username}, ${email}, ${passwordHash}, ${userRole})
      RETURNING id, username, email, role, created_at
    `

    const user = result[0]

    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role as UserRole,
    }

    const access = await createAccessToken(tokenPayload)
    const refresh = await createRefreshToken(tokenPayload)

    return NextResponse.json({
      access,
      refresh,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
    })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
