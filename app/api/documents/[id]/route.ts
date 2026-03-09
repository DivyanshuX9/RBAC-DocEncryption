import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"
import { logAccessOnChain, isBlockchainEnabled } from "@/lib/blockchain"
import { decryptColumnKey, decryptColumnData } from "@/lib/encryption"
import { computeSHA256, deterministicStringify } from "@/lib/crypto"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const docId = parseInt(id)
  if (isNaN(docId)) return NextResponse.json({ error: "Invalid document ID" }, { status: 400 })

  const sql = getDb()

  const docs = await sql`
    SELECT d.*, u.username as creator_username,
      EXISTS(SELECT 1 FROM blockchain_records br WHERE br.document_id = d.id AND br.verified = true) as blockchain_verified
    FROM documents d
    JOIN users u ON d.creator_id = u.id
    WHERE d.id = ${docId}
  `
  if (docs.length === 0) return NextResponse.json({ error: "Document not found" }, { status: 404 })
  const doc = docs[0]

  // Step 4: Blockchain Integrity Verification
  const encCols = await sql`
    SELECT * FROM encrypted_columns WHERE document_id = ${docId} ORDER BY id
  `

  if (encCols.length === 0) {
    console.error(`No encrypted columns found for document ${docId}`)
    return NextResponse.json({ error: "Document data not found" }, { status: 404 })
  }

  // Calculate hash of encrypted data (must match upload format)
  const parsedColumns = encCols.map(col => ({
    name: col.column_name,
    encrypted_data: typeof col.encrypted_data === 'string' ? JSON.parse(col.encrypted_data) : col.encrypted_data
  }))
  const encryptedDataObj = { columns: parsedColumns }
  const encryptedDataString = deterministicStringify(encryptedDataObj)
  const currentHash = await computeSHA256(encryptedDataString)

  // Compare with stored hash
  if (doc.sha256_hash !== currentHash) {
    return NextResponse.json(
      { error: "Document integrity verification failed. Possible tampering detected." },
      { status: 403 }
    )
  }

  const accessedColumns: string[] = []
  const deniedColumns: string[] = []
  const columns = []

  for (const col of encCols) {
    const roles = col.allowed_roles as string[]
    const accessible = roles.includes(user.role)

    if (accessible) {
      accessedColumns.push(col.column_name)

      // Fetch encrypted column key
      const keyRecords = await sql`
        SELECT encrypted_key, iv FROM encryption_keys 
        WHERE document_id = ${docId} AND column_name = ${col.column_name}
      `

      if (keyRecords.length > 0) {
        try {
          // Decrypt column key
          const columnKey = await decryptColumnKey(
            keyRecords[0].encrypted_key,
            keyRecords[0].iv
          )

          // Decrypt column data
          const encryptedData = col.encrypted_data as Array<{
            row: number
            ciphertext: string
            iv: string
          }>
          const decryptedData = await decryptColumnData(encryptedData, columnKey)

          columns.push({
            name: col.column_name,
            accessible: true,
            allowed_roles: roles,
            data: decryptedData,
          })
        } catch (error) {
          console.error(`Decryption failed for column ${col.column_name}:`, error)
          columns.push({
            name: col.column_name,
            accessible: false,
            allowed_roles: roles,
            data: [],
          })
        }
      } else {
        columns.push({
          name: col.column_name,
          accessible: true,
          allowed_roles: roles,
          data: [],
        })
      }
    } else {
      deniedColumns.push(col.column_name)
      columns.push({
        name: col.column_name,
        accessible: false,
        allowed_roles: roles,
        data: [],
      })
    }
  }

  let txHash = null

  if (isBlockchainEnabled()) {
    try {
      const result = await logAccessOnChain(docId, accessedColumns, deniedColumns)
      txHash = result.txHash
    } catch (error) {
      console.error("Blockchain access logging failed:", error)
    }
  }

  await sql`
    INSERT INTO audit_logs (user_id, document_id, accessed_columns, denied_columns, action, ip_address, tx_hash)
    VALUES (${user.userId}, ${docId}, ${accessedColumns}, ${deniedColumns}, 'view', '0.0.0.0', ${txHash})
  `

  return NextResponse.json({
    document: {
      ...doc,
      column_schema: typeof doc.column_schema === "string" ? JSON.parse(doc.column_schema) : doc.column_schema,
    },
    columns,
  })
}
