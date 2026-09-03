// scripts/migrate-games.mjs
import pg from "pg";
import QueryStream from "pg-query-stream";
import mongoose from "mongoose";

// Import your existing Game model directly
import Game from '../models/game.js';

const { Pool } = pg;

const PG_CONFIG = {
  host: "localhost",
  port: 5432,
  database: "games_api",
  user: "postgres",
  password: "pass123",
};

const MONGO_URI = "mongodb://admin:password@ip_address:27017/next-games?authSource=admin";

async function runMigration() {
  const pgPool = new Pool(PG_CONFIG);
  let pgClient;

  const BATCH_SIZE = 2000;
  let currentBatch = [];
  let totalMigrated = 0;
  const startTime = Date.now();

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    console.log("Connecting to PostgreSQL...");
    pgClient = await pgPool.connect();
    console.log("Connected to PostgreSQL.");

    const countResult = await pgClient.query("SELECT COUNT(*) FROM public.games_table;");
    const totalRows = parseInt(countResult.rows[0].count, 10);
    console.log(`Found ${totalRows.toLocaleString()} rows to migrate.\n`);

    const query = new QueryStream("SELECT * FROM public.games_table ORDER BY id ASC;");
    const stream = pgClient.query(query);

    for await (const row of stream) {
      const doc = {
        id: Number(row.id),
        title: row.title || "Untitled",
        img: row.img || "",
        console: row.console || "",
        genre: row.genre || "",
        publisher: row.publisher || "",
        developer: row.developer || "",
        critic_score: Number(row.critic_score) || 0,
        total_sales: Number(row.total_sales) || 0,
        release_date: row.release_date ? String(row.release_date) : "",
      };

      currentBatch.push({
        updateOne: {
          filter: { id: doc.id },
          update: { $set: doc },
          upsert: true,
        },
      });

      if (currentBatch.length >= BATCH_SIZE) {
        await Game.bulkWrite(currentBatch, { ordered: false });
        totalMigrated += currentBatch.length;
        currentBatch = [];

        const percent = ((totalMigrated / totalRows) * 100).toFixed(1);
        console.log(`Migrated: ${totalMigrated.toLocaleString()} / ${totalRows.toLocaleString()} (${percent}%)`);
      }
    }

    if (currentBatch.length > 0) {
      await Game.bulkWrite(currentBatch, { ordered: false });
      totalMigrated += currentBatch.length;
      console.log(`Migrated: ${totalMigrated.toLocaleString()} / ${totalRows.toLocaleString()} (100.0%)`);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nMigration completed in ${elapsed}s! Total games: ${totalMigrated.toLocaleString()}`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    if (pgClient) pgClient.release();
    await pgPool.end();
    await mongoose.disconnect();
    console.log("Database connections closed.");
    process.exit(0);
  }
}

runMigration();