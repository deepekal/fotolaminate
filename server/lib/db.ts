import pg, { type QueryResult, type QueryResultRow } from "pg";
import { env, pgSslOption } from "./env";

const { Pool } = pg;

const globalForPg = globalThis as unknown as { pgPool: pg.Pool | undefined };

function getPool(): pg.Pool {
  if (globalForPg.pgPool) return globalForPg.pgPool;

  const connectionString = env.supabasePoolerConnectionString;
  if (!connectionString) {
    throw new Error("Missing required env var: SUPABASE_POOLER_CONNECTION_STRING");
  }

  const newPool = new Pool({
    connectionString,
    ssl: pgSslOption(connectionString),
    max: 10,
  });

  // Increase max listeners to prevent EventEmitter warnings
  newPool.setMaxListeners(20);

  // Cache in every environment: without this, production created a new pool
  // per query and leaked connections until Postgres refused new clients.
  globalForPg.pgPool = newPool;

  return newPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params);
}
