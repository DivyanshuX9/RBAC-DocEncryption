import { NextResponse } from "next/server"
import { verifyToken, createAccessToken } from "@/lib/auth"
import type { UserRole } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const { refresh } = await request.json()

    if (!refresh) {
      return NextResponse.json({ error: "Refresh token required" }, { status: 400 })
    }

    const payload = await verifyToken(refresh)
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 })
    }

    const access = await createAccessToken({
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
      role: payload.role as UserRole,
    })

    return NextResponse.json({ access })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
