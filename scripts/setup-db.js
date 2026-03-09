import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in environment');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runSQL(filename) {
  console.log(`Running ${filename}...`);
  const sqlContent = readFileSync(join(__dirname, filename), 'utf-8');
  const statements = sqlContent.split(';').filter(s => s.trim());
  for (const statement of statements) {
    if (statement.trim()) {
      await sql(statement);
    }
  }
  console.log(`✓ ${filename} completed`);
}

async function setup() {
  try {
    await runSQL('001-create-tables.sql');
    await runSQL('002-seed-data.sql');
    await runSQL('003-seed-documents.sql');
    await runSQL('004-add-encryption.sql');
    console.log('\n✓ Database setup complete!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

setup();
