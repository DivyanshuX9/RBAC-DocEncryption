export type UserRole = "admin" | "teacher" | "student" | "office"

export interface User {
  id: number
  username: string
  email: string
  role: UserRole
  created_at: string
}

export interface Document {
  id: number
  creator_id: number
  document_name: string
  column_schema: string[]
  sha256_hash: string
  row_count: number
  created_at: string
  creator_username?: string
  blockchain_verified?: boolean
}

export interface EncryptedColumn {
  id: number
  document_id: number
  column_name: string
  allowed_roles: string[]
  encrypted_data: { row: number; val: string }[]
  created_at: string
}

export interface AuditLog {
  id: number
  user_id: number
  document_id: number
  accessed_columns: string[]
  denied_columns: string[]
  action: string
  ip_address: string | null
  tx_hash: string | null
  created_at: string
  username?: string
  document_name?: string
}

export interface BlockchainRecord {
  id: number
  document_id: number
  sha256_hash: string
  column_access_mapping: Record<string, string[]>
  creator_id: number
  tx_hash: string
  block_number: number | null
  verified: boolean
  created_at: string
}

export interface AuthTokenPayload {
  userId: number
  username: string
  email: string
  role: UserRole
  exp: number
  iat: number
}

export interface LoginResponse {
  access: string
  refresh: string
  user: User
}

export interface DocumentViewData {
  document: Document
  columns: {
    name: string
    accessible: boolean
    data: { row: number; val: string }[]
  }[]
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  teacher: "Teacher",
  student: "Student",
  office: "Office Staff",
}

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-red-500/15 text-red-400 border-red-500/30",
  teacher: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  student: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  office: "bg-amber-500/15 text-amber-400 border-amber-500/30",
}
