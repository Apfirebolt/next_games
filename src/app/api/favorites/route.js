// src/app/api/favorites/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Favorite from "@/models/favorite";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Retrieve all favorite games of the authenticated user
 *     tags: [Favorites]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite games retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Add a game to favorites
 *     tags: [Favorites]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - title
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 2434
 *               title:
 *                 type: string
 *                 example: Hot Wheels Turbo Racing
 *               img:
 *                 type: string
 *               console:
 *                 type: string
 *               genre:
 *                 type: string
 *               publisher:
 *                 type: string
 *               developer:
 *                 type: string
 *               critic_score:
 *                 type: number
 *               total_sales:
 *                 type: number
 *               release_date:
 *                 type: string
 *     responses:
 *       201:
 *         description: Game added to favorites
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Game already in favorites
 *       500:
 *         description: Internal server error
 */

export async function GET(request) {
  try {
    await dbConnect();
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { detail: "Unauthorized access. Please log in." },
        { status: 401 }
      );
    }

    const favorites = await Favorite.find({ user: user._id }).sort({
      createdAt: -1,
    });

    return NextResponse.json(favorites, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to fetch favorite games." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { detail: "Unauthorized access. Please log in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const gameId = body.id || body.gameId;

    if (!gameId || !body.title) {
      return NextResponse.json(
        { detail: "Game ID and title are required." },
        { status: 400 }
      );
    }

    // Check if duplicate already exists
    const existing = await Favorite.findOne({
      user: user._id,
      gameId: Number(gameId),
    });

    if (existing) {
      return NextResponse.json(
        { detail: "Game is already in your favorites." },
        { status: 409 }
      );
    }

    const favorite = await Favorite.create({
      user: user._id,
      gameId: Number(gameId),
      title: body.title,
      img: body.img || "",
      console: body.console || "",
      genre: body.genre || "",
      publisher: body.publisher || "",
      developer: body.developer || "",
      critic_score: Number(body.critic_score) || 0,
      total_sales: Number(body.total_sales) || 0,
      release_date: body.release_date || "",
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    // Catch MongoDB duplicate key error code 11000
    if (error.code === 11000) {
      return NextResponse.json(
        { detail: "Game is already in your favorites." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { detail: error.message || "Failed to add game to favorites." },
      { status: 500 }
    );
  }
}