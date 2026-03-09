import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"
import { verifyDocumentOnChain, isBlockchainEnabled } from "@/lib/blockchain"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const docId = parseInt(id)
  if (isNaN(docId)) return NextResponse.json({ error: "Invalid document ID" }, { status: 400 })

  const sql = getDb()

  const documents = await sql`
    SELECT * FROM documents WHERE id = ${docId}
  `

  if (documents.length === 0) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  const document = documents[0]
  let verified = false
  let txHash = null
  let blockNumber = null

  if (isBlockchainEnabled()) {
    try {
      const result = await verifyDocumentOnChain(docId, document.sha256_hash)
      verified = result.verified
      txHash = result.txHash
      blockNumber = result.blockNumber
    } catch (error) {
      console.error("Blockchain verification failed:", error)
      const records = await sql`
        SELECT * FROM blockchain_records WHERE document_id = ${docId} ORDER BY created_at DESC LIMIT 1
      `
      if (records.length > 0) {
        const record = records[0]
        verified = record.verified
        txHash = record.tx_hash
        blockNumber = record.block_number
      }
    }
  } else {
    const records = await sql`
      SELECT * FROM blockchain_records WHERE document_id = ${docId} ORDER BY created_at DESC LIMIT 1
    `
    if (records.length > 0) {
      const record = records[0]
      verified = record.verified
      txHash = record.tx_hash
      blockNumber = record.block_number
    }
  }

  await sql`
    INSERT INTO audit_logs (user_id, document_id, accessed_columns, denied_columns, action, ip_address, tx_hash)
    VALUES (${user.userId}, ${docId}, ARRAY[]::text[], ARRAY[]::text[], 'verify', '0.0.0.0', ${txHash})
  `

  return NextResponse.json({
    verified,
    tx_hash: txHash,
    block_number: blockNumber,
    sha256_hash: document.sha256_hash,
    blockchain_enabled: isBlockchainEnabled(),
  })
}
