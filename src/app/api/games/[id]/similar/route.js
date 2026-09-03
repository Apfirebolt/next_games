// src/app/api/games/[id]/similar/route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/dbConnect.js";
import { GameService } from "../../../../../services/gameService.js";

export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { id } = params;
    const result = await GameService.getSimilarGamesById(id);

    if (!result) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    // Optional: Add cache headers (similar games change rarely)
    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
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