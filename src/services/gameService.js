// src/services/gameService.js
import Game from "../models/game.js";

export class GameService {
  static async getSimilarGamesById(gameId) {
    const numericId = Number(gameId);
    if (isNaN(numericId)) return null;

    // 1. Fetch only the necessary fields of the target game
    const targetGame = await Game.findOne({ id: numericId })
      .select("id title img genre console similar_games")
      .lean();

    if (!targetGame) return null;

    if (!targetGame.similar_games || targetGame.similar_games.length === 0) {
      return {
        target: {
          id: targetGame.id,
          title: targetGame.title,
          img: targetGame.img,
          genre: targetGame.genre,
          console: targetGame.console,
        },
        similar: [],
      };
    }

    // 2. Map IDs and pre-index their similarity scores
    const neighborIds = targetGame.similar_games.map((item) => item.id);
    const scoreMap = new Map(
      targetGame.similar_games.map((item) => [item.id, item.score])
    );

    // 3. Hydrate catalog data in a single indexed query
    const catalogMatches = await Game.find({ id: { $in: neighborIds } })
      .select("id title img genre console developer critic_score total_sales")
      .lean();

    // 4. Attach score and restore the original descending rank order
    const hydratedSimilar = catalogMatches
      .map((game) => ({
        ...game,
        score: scoreMap.get(game.id) ?? 0,
      }))
      .sort((a, b) => b.score - a.score);

    return {
      target: {
        id: targetGame.id,
        title: targetGame.title,
        img: targetGame.img,
        genre: targetGame.genre,
        console: targetGame.console,
      },
      similar: hydratedSimilar,
    };
  }
}