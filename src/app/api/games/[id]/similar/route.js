// src/app/api/games/[id]/similar/route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/dbConnect.js";
import { getAuthenticatedUser } from "../../../../../lib/auth.js";
import { GameService } from "../../../../../services/gameService.js";

/**
 * @swagger
 * /api/games/{id}/similar:
 *   get:
 *     summary: Retrieve hydrated similar games for a given game ID
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric catalog ID or MongoDB _id
 *     responses:
 *       200:
 *         description: Similar games retrieved successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       404:
 *         description: Game not found
 *       500:
 *         description: Internal server error
 */
export async function GET(request, { params }) {
  try {
    // 1. Authenticate user before querying database
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Missing, invalid, or expired token" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = await params;
    const result = await GameService.getSimilarGamesById(id);

    if (!result) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    // Set Cache-Control to private so authenticated user responses aren't cached across shared proxies
    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[SimilarGamesAPI] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}