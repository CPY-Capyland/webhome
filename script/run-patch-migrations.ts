import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function main() {
  console.log('Running patch migrations...');
  const migrationsDir = path.join(__dirname, '../migrations');
  const migrationFiles = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.sql')).sort();

  for (const file of migrationFiles) {
    console.log(`Running migration ${file}...`);
    try {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      const statements = sql.split('--> statement-breakpoint');
      for (const statement of statements) {
        if (statement.trim()) {
          await db.execute(statement);
        }
      }
      console.log(`Migration ${file} completed.`);
    } catch (err: any) {
      if (err.message.includes('already exists') || err.message.includes('duplicate key')) {
        console.log(`Migration ${file} has already been applied, ignoring error.`);
      } else {
        throw err;
      }
    }
  }

  console.log('Patch migrations completed.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
