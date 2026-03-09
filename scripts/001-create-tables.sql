-- Role-Based Document Encryption Platform - Database Schema
-- Using Neon PostgreSQL for demo/standalone mode

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_name VARCHAR(255) NOT NULL,
  column_schema JSONB NOT NULL DEFAULT '[]',
  sha256_hash VARCHAR(64) NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Encrypted columns table
CREATE TABLE IF NOT EXISTS encrypted_columns (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  column_name VARCHAR(255) NOT NULL,
  allowed_roles TEXT[] NOT NULL DEFAULT '{}',
  encrypted_data JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  accessed_columns TEXT[] NOT NULL DEFAULT '{}',
  denied_columns TEXT[] NOT NULL DEFAULT '{}',
  action VARCHAR(50) NOT NULL DEFAULT 'view',
  ip_address VARCHAR(45),
  tx_hash VARCHAR(66),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blockchain records table
CREATE TABLE IF NOT EXISTS blockchain_records (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  sha256_hash VARCHAR(64) NOT NULL,
  column_access_mapping JSONB NOT NULL DEFAULT '{}',
  creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tx_hash VARCHAR(66) NOT NULL,
  block_number INTEGER,
  verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_creator ON documents(creator_id);
CREATE INDEX IF NOT EXISTS idx_encrypted_columns_document ON encrypted_columns(document_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_document ON audit_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blockchain_records_document ON blockchain_records(document_id);
