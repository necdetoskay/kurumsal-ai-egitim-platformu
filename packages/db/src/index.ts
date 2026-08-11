import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export function createDatabase(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  return {
    db,
    pool,
    async ping(): Promise<void> {
      await pool.query('select 1');
    },
    async close(): Promise<void> {
      await pool.end();
    },
  };
}

export type DatabaseClient = ReturnType<typeof createDatabase>;
