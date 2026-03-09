import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"
import { computeSHA256, deterministicStringify } from "@/lib/crypto"
import { storeDocumentOnChain, isBlockchainEnabled } from "@/lib/blockchain"
import {
  generateColumnKey,
  encryptColumnData,
  encryptColumnKey,
} from "@/lib/encryption"

export async function GET(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sql = getDb()
  const documents = await sql`
    SELECT d.*, u.username as creator_username,
      EXISTS(SELECT 1 FROM blockchain_records br WHERE br.document_id = d.id AND br.verified = true) as blockchain_verified
    FROM documents d
    JOIN users u ON d.creator_id = u.id
    ORDER BY d.created_at DESC
  `

  return NextResponse.json(documents)
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (user.role !== "admin" && user.role !== "teacher") {
    return NextResponse.json({ error: "Only admins and teachers can upload documents" }, { status: 403 })
  }

  try {
    const { document_name, columns, data } = await request.json()

    if (!document_name || !columns || !data) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const sql = getDb()

    // Encrypt all columns first
    const encryptedColumns = []
    for (const col of columns) {
      const colData = data.map((row: Record<string, string>, idx: number) => ({
        row: idx + 1,
        val: row[col.name] || "",
      }))

      const columnKey = await generateColumnKey()
      const encryptedData = await encryptColumnData(colData, columnKey)
      const { encryptedKey, iv: keyIv } = await encryptColumnKey(columnKey)

      encryptedColumns.push({
        name: col.name,
        allowed_roles: col.allowed_roles,
        encrypted_data: encryptedData,
        encrypted_key: encryptedKey,
        key_iv: keyIv,
      })
    }

    // Calculate hash from encrypted data
    const encryptedDataObj = {
      columns: encryptedColumns.map(col => ({
        name: col.name,
        encrypted_data: col.encrypted_data
      }))
    }
    const encryptedDataString = deterministicStringify(encryptedDataObj)
    const sha256Hash = await computeSHA256(encryptedDataString)

    const docResult = await sql`
      INSERT INTO documents (creator_id, document_name, column_schema, sha256_hash, row_count)
      VALUES (${user.userId}, ${document_name}, ${JSON.stringify(columns)}, ${sha256Hash}, ${data.length})
      RETURNING *
    `
    const doc = docResult[0]

    // Store encrypted columns and keys
    for (const col of encryptedColumns) {
      await sql`
        INSERT INTO encrypted_columns (document_id, column_name, allowed_roles, encrypted_data)
        VALUES (${doc.id}, ${col.name}, ${col.allowed_roles}, ${JSON.stringify(col.encrypted_data)})
      `

      await sql`
        INSERT INTO encryption_keys (document_id, column_name, encrypted_key, iv)
        VALUES (${doc.id}, ${col.name}, ${col.encrypted_key}, ${col.key_iv})
      `
    }

    await sql`
      INSERT INTO audit_logs (user_id, document_id, accessed_columns, denied_columns, action, ip_address)
      VALUES (${user.userId}, ${doc.id}, ${encryptedColumns.map((c) => c.name)}, ARRAY[]::text[], 'upload', '0.0.0.0')
    `

    let txHash = null
    let blockNumber = null
    const columnMapping: Record<string, string[]> = {}
    for (const col of encryptedColumns) {
      columnMapping[col.name] = col.allowed_roles
    }

    if (isBlockchainEnabled()) {
      try {
        const result = await storeDocumentOnChain(doc.id, sha256Hash, columnMapping)
        txHash = result.txHash
        blockNumber = result.blockNumber
      } catch (error: any) {
        if (error?.message?.includes("already registered")) {
          console.log(`Document ${doc.id} already on blockchain, fetching existing record`)
          // Document exists on chain, mark as verified anyway
          const chainRecords = await sql`
            SELECT tx_hash, block_number FROM blockchain_records 
            WHERE document_id = ${doc.id} AND verified = true 
            ORDER BY created_at DESC LIMIT 1
          `
          if (chainRecords.length > 0) {
            txHash = chainRecords[0].tx_hash
            blockNumber = chainRecords[0].block_number
          }
        } else {
          console.error("Blockchain storage failed:", error)
        }
      }
    }

    await sql`
      INSERT INTO blockchain_records (document_id, sha256_hash, column_access_mapping, creator_id, tx_hash, block_number, verified)
      VALUES (${doc.id}, ${sha256Hash}, ${JSON.stringify(columnMapping)}, ${user.userId}, ${txHash}, ${blockNumber}, ${txHash !== null})
    `

    return NextResponse.json({ ...doc, tx_hash: txHash, blockchain_enabled: isBlockchainEnabled() })
  } catch (error) {
    console.error("Document upload error:", error)
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
  }
}
