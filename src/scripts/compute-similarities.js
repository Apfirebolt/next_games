import mongoose from "mongoose";
import Game from "../models/game.js"; // Adjust path if models/ is in root

const MONGO_URI = "mongodb://admin:yourStrongPassword@168.144.26.11:27017/next-games?authSource=admin";

// Sparse Cosine Similarity: only compares non-zero attributes directly
function computeSparseCosine(target, candidate) {
  let dotProduct = 0;

  // Genre match (weight 2.5)
  if (target.genre && candidate.genre && target.genre === candidate.genre) {
    dotProduct += 2.5 * 2.5;
  }
  // Developer match (weight 2.0)
  if (target.developer && candidate.developer && target.developer === candidate.developer) {
    dotProduct += 2.0 * 2.0;
  }
  // Console match (weight 1.0)
  if (target.console && candidate.console && target.console === candidate.console) {
    dotProduct += 1.0 * 1.0;
  }
  // Critic score match (normalized 0-1)
  const tScore = (target.critic_score || 0) / 10.0;
  const cScore = (candidate.critic_score || 0) / 10.0;
  dotProduct += tScore * cScore;

  const denominator = target._mag * candidate._mag;
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

async function runComputation() {
  const startTime = Date.now();
  const TARGET_LIMIT = 63979;

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);

  console.log("Loading catalog metadata...");
  // Fetch only the lightweight fields needed for the candidate pool
  const games = await Game.find({})
    .select("id title genre console developer critic_score")
    .lean();

  console.log(`Loaded ${games.length.toLocaleString()} games into memory.`);

  // 1. Precompute vector magnitude for each game: sqrt(sum(weight^2))
  for (const g of games) {
    let sumSq = 0;
    if (g.genre) sumSq += 2.5 * 2.5;
    if (g.developer) sumSq += 2.0 * 2.0;
    if (g.console) sumSq += 1.0 * 1.0;
    const score = (g.critic_score || 0) / 10.0;
    sumSq += score * score;
    g._mag = Math.sqrt(sumSq);
  }

  // 2. Identify the first 100 target IDs
  const targetIds = new Set(games.slice(0, TARGET_LIMIT).map((g) => g.id));
  console.log(`Computing similarities for the first ${targetIds.size} games...\n`);

  // 3. Bucket into genre groups for fast candidate pooling
  const genreBuckets = new Map();
  for (const g of games) {
    const key = g.genre || "Uncategorized";
    if (!genreBuckets.has(key)) genreBuckets.set(key, []);
    genreBuckets.get(key).push(g);
  }

  const bulkOps = [];
  let processed = 0;

  for (const bucket of genreBuckets.values()) {
    // Limit comparison candidate pool so massive genres don't stall
    const candidatePool = bucket.length > 1500 ? bucket.slice(0, 1500) : bucket;

    for (let i = 0; i < bucket.length; i++) {
      const target = bucket[i];

      // Skip games that are not part of our 100 target set
      if (!targetIds.has(target.id)) continue;

      const scores = [];

      for (let j = 0; j < candidatePool.length; j++) {
        const candidate = candidatePool[j];
        if (target.id === candidate.id) continue;

        const sim = computeSparseCosine(target, candidate);
        if (sim > 0) {
          scores.push({ id: candidate.id, score: Math.round(sim * 1000) / 1000 });
        }
      }

      // Sort descending and keep top 10
      scores.sort((a, b) => b.score - a.score);
      const top10 = scores.slice(0, 10);

      bulkOps.push({
        updateOne: {
          filter: { id: target.id },
          update: { $set: { similar_games: top10 } },
        },
      });

      processed++;

      if (processed >= TARGET_LIMIT) break;
    }

    if (processed >= TARGET_LIMIT) break;
  }

  // 4. Update the 100 documents in MongoDB
  if (bulkOps.length > 0) {
    console.log(`Saving ${bulkOps.length} records to MongoDB...`);
    await Game.bulkWrite(bulkOps, { ordered: false });
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\nSuccessfully updated ${processed} games in ${duration}s!`);

  await mongoose.disconnect();
  process.exit(0);
}

runComputation().catch((err) => {
  console.error("Error during computation:", err);
  process.exit(1);
});