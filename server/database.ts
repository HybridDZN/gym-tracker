import pg from 'pg';
const { Pool } = pg;
import { Kysely, PostgresDialect } from 'kysely'
import type { DB, Workouts} from '../src/db/db';
import dotenv from 'dotenv';
dotenv.config();
console.log(`Connecting to database at ${process.env.POSTGRES_DB_URL}`);
console.log(`Connecting to DB at ${process.env.DATABASE_URL}`);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }  // Needed for Neon
});

export const db = new Kysely<DB>({
  dialect: new PostgresDialect({ pool }),
});

db.selectFrom('workouts')
  .selectAll()
  .limit(1)
  .execute()
  .then(() => console.log('✅ Connected to remote DB!'))
  .catch(err => console.error('❌ DB connection failed:', err));

export async function insertWorkout(workout: Omit<Workouts, 'created_time'>) {
  const result = await db
    .insertInto('workouts')
    .values({
      ...workout,
      created_time: new Date().toISOString(),
    })
    .returningAll() 
    .executeTakeFirst();

  return result;
}