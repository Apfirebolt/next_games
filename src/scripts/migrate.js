// scripts/migrate-games.mjs
import pg from "pg";
import QueryStream from "pg-query-stream";

const { Pool } = pg;

// 1. Connection Configurations
const PG_CONFIG = {
  host: "localhost",
  port: 5432,
  database: "games_api",
  user: "postgres",
  password: "pass123",
};

// 3. Batch Migration Logic
async function runMigration() {
  const pgPool = new Pool(PG_CONFIG);
  let pgClient;

  let currentBatch = [];
  let totalMigrated = 0;
  const startTime = Date.now();

  try {

    console.log("Connecting to PostgreSQL...");
    pgClient = await pgPool.connect();
    console.log("Connected to PostgreSQL.");

    // Get total count for progress estimation
    const countResult = await pgClient.query("SELECT COUNT(*) FROM public.games_table;");
    const totalRows = parseInt(countResult.rows[0].count, 10);
    console.log(`Found ${totalRows.toLocaleString()} rows to migrate.\n`);

    // Stream query to avoid high memory spikes
    const query = new QueryStream("SELECT * FROM public.games_table ORDER BY id ASC LIMIT 10;");
    const stream = pgClient.query(query);
    // process only first 10 rows for testing
    for await (const row of stream) {
      console.log(`Migrating row ID: ${row.id}`);
    }
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nMigration completed successfully in ${elapsed}s! Total games: ${totalMigrated.toLocaleString()}`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    if (pgClient) pgClient.release();
    await pgPool.end();
    console.log("Database connections closed.");
    process.exit(0);
  }
}

runMigration();