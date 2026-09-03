// src/app/api/games/route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import { getAuthenticatedUser } from "../../../lib/auth";
import Game from "../../../models/game";

/**
 * @swagger
 * /api/games:
 *   get:
 *     summary: Retrieve paginated list of games
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of items per page (capped at 50)
 *     responses:
 *       200:
 *         description: Paginated games retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 games:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function GET(request) {
  try {
    // 1. Authenticate user before performing database queries
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Missing, invalid, or expired token" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);

    // 2. Parse and sanitize query parameters
    const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
    const requestedLimit = parseInt(searchParams.get("limit"), 10) || 50;
    const limit = Math.min(Math.max(1, requestedLimit), 50);

    const skip = (page - 1) * limit;

    // 3. Run count and paginated query concurrently
    const [totalItems, games] = await Promise.all([
      Game.countDocuments({}),
      Game.find({})
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    const formattedGames = games.map((game) => ({
      id: game._id,
      gameId: game.id,
      title: game.title,
      genre: game.genre,
      publisher: game.publisher,
      releaseDate: game.releaseDate,
      createdAt: game.createdAt,
      similar_games: game.similar_games || [],
    }));

    return NextResponse.json(
      {
        games: formattedGames,
        pagination: {
          totalItems,
          totalPages,
          currentPage: page,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to retrieve games." },
      { status: 500 }
    );
  }
}