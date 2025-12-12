import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { laws } from '../shared/schema';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const db = drizzle(pool);

async function main() {
  console.log('Clearing all laws from the database...');
  await db.delete(laws);
  console.log('All laws have been cleared.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to clear laws:', err);
  process.exit(1);
});
