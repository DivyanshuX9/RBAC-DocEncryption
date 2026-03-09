-- Add encryption_keys table for storing encrypted column keys
CREATE TABLE IF NOT EXISTS encryption_keys (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  column_name VARCHAR(255) NOT NULL,
  encrypted_key TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, column_name)
);

CREATE INDEX IF NOT EXISTS idx_encryption_keys_document ON encryption_keys(document_id);

-- Update encrypted_columns to store ciphertext format
-- Note: Existing data will need migration
ALTER TABLE encrypted_columns 
  ADD COLUMN IF NOT EXISTS key_id VARCHAR(255);
