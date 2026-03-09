import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { createAccessToken, createRefreshToken, verifyPassword } from "@/lib/auth"
import type { UserRole } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 })
    }

    const sql = getDb()
    const users = await sql`SELECT * FROM users WHERE username = ${username}`

    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const user = users[0]

    if (!verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

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
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
