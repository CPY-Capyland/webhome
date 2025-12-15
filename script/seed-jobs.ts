import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { randomUUID } from 'crypto';
import { jobs } from '../shared/schema';

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

const jobsData = [
  { name: 'Agriculteur', grossSalary: 40, fees: -10, justification: 'Semences, entretien, météo' },
  { name: 'Ouvrier BTP', grossSalary: 45, fees: -12, justification: 'Usure physique, outils' },
  { name: 'Éboueur / Nettoyeur', grossSalary: 48, fees: -10, justification: 'Traitements sanitaires' },
  { name: 'Enseignant', grossSalary: 50, fees: -15, justification: 'Matériel pédagogique' },
  { name: 'Force de l’Ordre', grossSalary: 60, fees: -25, justification: 'Assurance + équipement' },
  { name: 'Transporteur', grossSalary: 65, fees: -30, justification: 'Carburant, péages' },
  { name: 'Ingénieur Énergie', grossSalary: 75, fees: -40, justification: 'Pièces rares' },
  { name: 'Médecin', grossSalary: 85, fees: -50, justification: 'Coûts médicaux' },
  { name: 'Juge / Dirigeant', grossSalary: 99, fees: -65, justification: 'Sécurité + représentation' },
];

async function main() {
  console.log('Seeding jobs...');
  for (const job of jobsData) {
    await db.insert(jobs).values({
      id: randomUUID(),
      ...job,
    });
  }
  console.log('Jobs seeded.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
