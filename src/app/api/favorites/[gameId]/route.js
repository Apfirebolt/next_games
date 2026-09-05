// src/app/api/favorites/[gameId]/route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import Favorite from "../../../../models/favorite";
import { getAuthenticatedUser } from "../../../../lib/auth";

/**
 * @swagger
 * /api/favorites/{gameId}:
 *   get:
 *     summary: Check if a game is favorited and return its review if present
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
 *         description: Status and review data returned successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Add or update a review for a favorited game
 *     tags: [Favorites]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               rating:
 *                 type: number
 *     responses:
 *       200:
 *         description: Review saved successfully
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Game not in favorites
 *       500:
 *         description: Internal server error
 *   patch:
 *     summary: Delete only the review for this game (keeps the game favorited)
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
 *         description: Review removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Favorite record not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Remove a game from favorites entirely (along with any review)
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
    }).lean();

    return NextResponse.json(
      {
        isFavorited: Boolean(favorite),
        favoriteId: favorite?._id || null,
        review: favorite?.review || null,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to check favorite status." },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
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
    const body = await request.json();
    const { title = "", content = "", rating = null } = body;

    if (rating !== null && (rating < 1 || rating > 10)) {
      return NextResponse.json(
        { detail: "Rating must be between 1 and 10." },
        { status: 400 }
      );
    }

    const favorite = await Favorite.findOne({
      user: user._id,
      gameId: Number(gameId),
    });

    if (!favorite) {
      return NextResponse.json(
        { detail: "Game must be added to favorites before adding a review." },
        { status: 404 }
      );
    }

    // Upsert review subdocument
    favorite.review = {
      title: title.trim(),
      content: content.trim(),
      rating: rating ? Number(rating) : null,
    };

    await favorite.save();

    return NextResponse.json(
      {
        message: "Review saved successfully.",
        review: favorite.review,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to save review." },
      { status: 500 }
    );
  }
}

// Clear review while keeping game in favorites
export async function PATCH(request, { params }) {
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

    const favorite = await Favorite.findOneAndUpdate(
      { user: user._id, gameId: Number(gameId) },
      { $unset: { review: "" } },
      { new: true }
    );

    if (!favorite) {
      return NextResponse.json(
        { detail: "Favorite game record not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Review deleted successfully.", review: null },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to delete review." },
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
      {
        message: "Game removed from favorites successfully.",
        gameId: Number(gameId),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to delete favorite game." },
      { status: 500 }
    );
  }
}