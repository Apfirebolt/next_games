// src/app/api/similar/[id]/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "../../../../lib/dbConnect";
import Game from "../../../../models/game";

/**
 * @swagger
 * /api/similar/{id}:
 *   get:
 *     summary: Retrieve detailed information for all similar games by game ID
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Either the MongoDB _id (ObjectId) or the numeric catalog id
 *     responses:
 *       200:
 *         description: List of detailed similar games retrieved successfully
 *       404:
 *         description: Game not found
 *       500:
 *         description: Internal server error
 */
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;

    // 1. Build dynamic query: support both MongoDB _id (hex 24) and catalog numeric id
    const isObjectId = mongoose.Types.ObjectId.isValid(id) && id.length === 24;
    const isNumeric = !isNaN(Number(id));

    if (!isObjectId && !isNumeric) {
      return NextResponse.json(
        { error: "Invalid ID format provided." },
        { status: 400 }
      );
    }

    const query = isObjectId ? { _id: id } : { id: Number(id) };

    // 2. Find target game
    const targetGame = await Game.findOne(query)
      .select("id title genre console img publisher developer critic_score similar_games")
      .lean();

    if (!targetGame) {
      return NextResponse.json(
        { error: "Target game not found." },
        { status: 404 }
      );
    }

    // 3. Return early if no similar games exist
    if (!targetGame.similar_games || targetGame.similar_games.length === 0) {
      return NextResponse.json(
        {
          game: {
            id: targetGame._id,
            catalogId: targetGame.id,
            title: targetGame.title,
            genre: targetGame.genre,
            console: targetGame.console,
          },
          similarGames: [],
        },
        { status: 200 }
      );
    }

    // 4. Extract neighbor numeric IDs and index similarity scores
    const neighborCatalogIds = targetGame.similar_games.map((sg) => sg.id);
    const scoreMap = new Map(
      targetGame.similar_games.map((sg) => [sg.id, sg.score])
    );

    // 5. Query detailed game information for all matching IDs
    const detailedSimilarGames = await Game.find({
      id: { $in: neighborCatalogIds },
    })
      .select(
        "id title img console genre publisher developer critic_score total_sales release_date createdAt"
      )
      .lean();

    // 6. Merge similarity score and sort by descending relevance
    const hydratedSimilarGames = detailedSimilarGames
      .map((game) => ({
        id: game._id,
        catalogId: game.id,
        title: game.title,
        img: game.img,
        console: game.console,
        genre: game.genre,
        publisher: game.publisher,
        developer: game.developer,
        criticScore: game.critic_score,
        totalSales: game.total_sales,
        releaseDate: game.release_date,
        similarityScore: scoreMap.get(game.id) ?? 0,
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore);

    return NextResponse.json(
      {
        game: {
          id: targetGame._id,
          catalogId: targetGame.id,
          title: targetGame.title,
          genre: targetGame.genre,
          console: targetGame.console,
        },
        similarGames: hydratedSimilarGames,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("[SimilarGamesAPI] Error:", error);
    return NextResponse.json(
      { detail: error.message || "Failed to retrieve similar games." },
      { status: 500 }
    );
  }
}