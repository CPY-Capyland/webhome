import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function main() {
  console.log('Running second migration...');
  const sql = fs.readFileSync(path.join(__dirname, '../migrations/0001_rich_ikaris.sql'), 'utf-8');
  const statements = sql.split('--> statement-breakpoint');
  for (const statement of statements) {
    if (statement.trim()) {
      await db.execute(statement);
    }
  }
  console.log('Second migration completed.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
