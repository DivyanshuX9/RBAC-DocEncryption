import { SignJWT, jwtVerify } from "jose"
import type { AuthTokenPayload, UserRole } from "./types"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production-32chars!"
)

const ACCESS_TOKEN_EXPIRY = "1h"
const REFRESH_TOKEN_EXPIRY = "7d"

export async function createAccessToken(payload: {
  userId: number
  username: string
  email: string
  role: UserRole
}) {
  return new SignJWT({
    userId: payload.userId,
    username: payload.username,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET)
}

export async function createRefreshToken(payload: {
  userId: number
  username: string
  email: string
  role: UserRole
}) {
  return new SignJWT({
    userId: payload.userId,
    username: payload.username,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as AuthTokenPayload
  } catch {
    return null
  }
}

export async function getUserFromRequest(request: Request): Promise<AuthTokenPayload | null> {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null
  return verifyToken(authHeader.slice(7))
}

export function hashPassword(password: string): string {
  // Simple hash for demo - in production use bcrypt
  const crypto = globalThis.crypto || require("crypto").webcrypto
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "salt_rbdec_2026")
  let hash = 0
  const bytes = data
  for (let i = 0; i < bytes.length; i++) {
    hash = ((hash << 5) - hash + bytes[i]) | 0
  }
  return "pbkdf2$" + Math.abs(hash).toString(16).padStart(16, "0")
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}
