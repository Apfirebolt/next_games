// src/services/recommendationService.js
import Game from "../models/game";
import Favorite from "../models/favorite";
import { extractFranchiseKey } from "../lib/recommendationUtils";

export class RecommendationService {
  /**
   * Generates diversified recommendations based on user favorites.
   */
  static async getUserRecommendations(userId) {
    // 1. Fetch user's favorited game IDs
    const userFavorites = await Favorite.find({ user: userId })
      .select("gameId")
      .lean();

    const favoriteGameIds = new Set(userFavorites.map((f) => Number(f.gameId)));

    // Constraint: Minimum 3 games required
    if (favoriteGameIds.size < 3) {
      return {
        isEligible: false,
        requiredCount: 3,
        currentCount: favoriteGameIds.size,
        recommendations: [],
        message: "Save at least 3 games to unlock personalized recommendations.",
      };
    }

    // Dynamic target count: 3 -> 15, 4 -> 20, max 50
    const targetCount = Math.min(favoriteGameIds.size * 5, 50);

    // 2. Fetch the target games and their precomputed similar_games lists
    const seedGames = await Game.find({ id: { $in: Array.from(favoriteGameIds) } })
      .select("id title genre similar_games")
      .lean();

    // 3. Aggregate candidate scores
    const candidateScoreMap = new Map(); // catalogId -> aggregatedScore

    for (const seed of seedGames) {
      if (!seed.similar_games) continue;

      for (const sim of seed.similar_games) {
        // Exclude games already in the user's favorites
        if (favoriteGameIds.has(sim.id)) continue;

        const current = candidateScoreMap.get(sim.id) || 0;
        // Reinforce candidates that are similar to multiple favorited titles
        candidateScoreMap.set(sim.id, current + sim.score);
      }
    }

    if (candidateScoreMap.size === 0) {
      return {
        isEligible: true,
        recommendations: [],
      };
    }

    // 4. Hydrate metadata for all potential candidates
    const candidateIds = Array.from(candidateScoreMap.keys());
    const catalogCandidates = await Game.find({ id: { $in: candidateIds } })
      .select("id title img genre console developer publisher critic_score release_date")
      .lean();

    // Attach raw combined score
    const scoredList = catalogCandidates.map((game) => ({
      ...game,
      aggregatedScore: candidateScoreMap.get(game.id) || 0,
      franchiseKey: extractFranchiseKey(game.title),
    }));

    // Sort descending by raw aggregated score
    scoredList.sort((a, b) => b.aggregatedScore - a.aggregatedScore);

    // 5. Franchise Diversity Filter (Solves the "FIFA" duplicate problem)
    // We also collect the franchise keys of the user's favorites so we penalize / de-prioritize clones
    const favoriteFranchises = new Set(seedGames.map((s) => extractFranchiseKey(s.title)));

    const diversifiedList = [];
    const franchiseCount = new Map();
    const deferredList = []; // Holds extra games from already-capped franchises

    for (const item of scoredList) {
      const key = item.franchiseKey || item.title.toLowerCase();
      const count = franchiseCount.get(key) || 0;

      // Rule: If game is part of a series the user already favorited, allow max 1 entry.
      // Otherwise, allow max 1 entry per new franchise in the primary tier.
      const isAlreadyFavoritedFranchise = favoriteFranchises.has(key);
      const franchiseCap = isAlreadyFavoritedFranchise ? 1 : 1;

      if (count < franchiseCap) {
        diversifiedList.push(item);
        franchiseCount.set(key, count + 1);
      } else {
        deferredList.push(item);
      }

      if (diversifiedList.length >= targetCount) break;
    }

    // If strictly diverse pool is slightly smaller than targetCount, backfill from deferred
    while (diversifiedList.length < targetCount && deferredList.length > 0) {
      diversifiedList.push(deferredList.shift());
    }

    // Format output
    const recommendations = diversifiedList.slice(0, targetCount).map((game) => ({
      id: game._id,
      catalogId: game.id,
      title: game.title,
      img: game.img,
      genre: game.genre,
      console: game.console,
      developer: game.developer,
      criticScore: game.critic_score,
      releaseDate: game.release_date,
      score: Math.round(game.aggregatedScore * 100) / 100,
    }));

    return {
      isEligible: true,
      currentCount: favoriteGameIds.size,
      targetCount,
      recommendations,
    };
  }
}