import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import Friendship from "../../../../models/friendship";
import { getAuthenticatedUser } from "../../../../lib/auth";

/**
 * @swagger
 * /api/friends/{friendshipId}:
 *   patch:
 *     summary: Respond to a friend request (accept or reject)
 *     tags: [Friends]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendshipId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [accept, reject]
 *     responses:
 *       200:
 *         description: Friend request updated successfully
 *       400:
 *         description: Invalid action or invalid state transition
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only the recipient can accept or reject
 *       404:
 *         description: Request not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Unfriend a user or cancel a pending outgoing request
 *     tags: [Friends]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendshipId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Friendship or request removed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Record not found
 *       500:
 *         description: Internal server error
 */
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

    const { friendshipId } = await params;
    const { action } = await request.json();

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { detail: "Action must be either 'accept' or 'reject'." },
        { status: 400 }
      );
    }

    const friendship = await Friendship.findById(friendshipId);

    if (!friendship) {
      return NextResponse.json(
        { detail: "Friend request not found." },
        { status: 404 }
      );
    }

    // Only the designated recipient can accept or reject
    if (friendship.recipient.toString() !== user._id.toString()) {
      return NextResponse.json(
        { detail: "You are not authorized to respond to this friend request." },
        { status: 403 }
      );
    }

    if (friendship.status !== "pending") {
      return NextResponse.json(
        { detail: `Request has already been ${friendship.status}.` },
        { status: 400 }
      );
    }

    friendship.status = action === "accept" ? "accepted" : "rejected";
    await friendship.save();

    return NextResponse.json(
      {
        message: `Friend request ${friendship.status} successfully.`,
        status: friendship.status,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to update friend request." },
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

    const { friendshipId } = await params;
    const friendship = await Friendship.findById(friendshipId);

    if (!friendship) {
      return NextResponse.json(
        { detail: "Friendship or request not found." },
        { status: 404 }
      );
    }

    const userIdStr = user._id.toString();
    const isParticipant =
      friendship.requester.toString() === userIdStr ||
      friendship.recipient.toString() === userIdStr;

    if (!isParticipant) {
      return NextResponse.json(
        { detail: "You are not authorized to delete this record." },
        { status: 403 }
      );
    }

    await Friendship.findByIdAndDelete(friendshipId);

    return NextResponse.json(
      { message: "Friendship or request removed successfully." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to remove friendship record." },
      { status: 500 }
    );
  }
}