import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import { Thread } from "../../../../models/thread";

/**
 * @swagger
 * /api/threads/{threadId}:
 *   get:
 *     summary: Retrieve a single thread by ID and increment its view counter
 *     tags: [Threads]
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *         description: The MongoDB ObjectId of the thread
 *     responses:
 *       200:
 *         description: Thread details retrieved
 *       404:
 *         description: Thread not found
 *       500:
 *         description: Internal server error
 */
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { threadId } = await params;

    const thread = await Thread.findByIdAndUpdate(
      threadId,
      { $inc: { viewsCount: 1 } },
      { new: true }
    ).populate("categoryId", "title slug");

    if (!thread) {
      return NextResponse.json({ detail: "Thread not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: thread });
  } catch (error) {
    return NextResponse.json({ detail: error.message || "Failed to fetch thread." }, { status: 500 });
  }
}