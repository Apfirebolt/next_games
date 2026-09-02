// src/app/api/favorites/[gameId]/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Favorite from "@/models/favorite";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * @swagger
 * /api/favorites/{gameId}:
 *   get:
 *     summary: Check if a specific game is in user favorites
 *     tags: [Favorites]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: integer
 *         description: External Game ID (e.g., 2434)
 *     responses:
 *       200:
 *         description: Status returned successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Remove a game from favorites
 *     tags: [Favorites]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Game removed from favorites successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Favorite record not found
 *       500:
 *         description: Internal server error
 */

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { detail: "Unauthorized access. Please log in." },
        { status: 401 }
      );
    }

    const { gameId } = await params;

    const favorite = await Favorite.findOne({
      user: user._id,
      gameId: Number(gameId),
    });

    return NextResponse.json(
      { isFavorited: Boolean(favorite) },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to check favorite status." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { detail: "Unauthorized access. Please log in." },
        { status: 401 }
      );
    }

    const { gameId } = await params;

    const deletedFavorite = await Favorite.findOneAndDelete({
      user: user._id,
      gameId: Number(gameId),
    });

    if (!deletedFavorite) {
      return NextResponse.json(
        { detail: "Favorite game not found or already removed." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Game removed from favorites successfully.", gameId: Number(gameId) },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to delete favorite game." },
      { status: 500 }
    );
  }
}