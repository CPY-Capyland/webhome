import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function main() {
  console.log('Running migrations...');
  try {
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('Migrations completed.');
  } catch (err: any) {
    if (err.message.includes('relation "houses" already exists')) {
      console.log('Initial migration has already been applied, ignoring error.');
    } else {
      throw err;
    }
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
