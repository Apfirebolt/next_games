// src/app/api/recommendations/user/route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import { getAuthenticatedUser } from "../../../../lib";
import { RecommendationService } from "../../../../services/recommendationService";

/**
 * @swagger
 * /api/recommendations/user:
 *   get:
 *     summary: Retrieve personalized recommendations based on favorited games
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommendations generated
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const result = await RecommendationService.getUserRecommendations(user._id);

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[UserRecommendationsAPI] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations." },
      { status: 500 }
    );
  }
}