import { NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import Friendship from "../../../models/friendship";
import User from "../../../models/user";
import { getAuthenticatedUser } from "../../../lib/auth";

/**
 * @swagger
 * /api/friends:
 *   get:
 *     summary: Get friends list or friend requests
 *     tags: [Friends]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [accepted, incoming, outgoing]
 *           default: accepted
 *         description: Filter relationship type
 *     responses:
 *       200:
 *         description: List retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Send a friend request
 *     tags: [Friends]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *             properties:
 *               recipientId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Friend request sent successfully
 *       400:
 *         description: Invalid request or friendship already exists
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recipient not found
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "accepted";
    const userFields = "firstName lastName username email image";

    if (type === "incoming") {
      const requests = await Friendship.find({
        recipient: user._id,
        status: "pending",
      })
        .populate("requester", userFields)
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json({ requests }, { status: 200 });
    }

    if (type === "outgoing") {
      const requests = await Friendship.find({
        requester: user._id,
        status: "pending",
      })
        .populate("recipient", userFields)
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json({ requests }, { status: 200 });
    }

    // Default: accepted friends (reciprocal)
    const friendships = await Friendship.find({
      $or: [{ requester: user._id }, { recipient: user._id }],
      status: "accepted",
    })
      .populate("requester", userFields)
      .populate("recipient", userFields)
      .lean();

    const friends = friendships.map((f) => {
      const isRequester = f.requester._id.toString() === user._id.toString();
      return {
        friendshipId: f._id,
        friend: isRequester ? f.recipient : f.requester,
        since: f.updatedAt,
      };
    });

    return NextResponse.json({ friends }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to retrieve friends data." },
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

    const { recipientId } = await request.json();

    if (!recipientId) {
      return NextResponse.json(
        { detail: "recipientId is required." },
        { status: 400 }
      );
    }

    if (user._id.toString() === recipientId) {
      return NextResponse.json(
        { detail: "You cannot send a friend request to yourself." },
        { status: 400 }
      );
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return NextResponse.json(
        { detail: "Recipient user not found." },
        { status: 404 }
      );
    }

    // Check if an active connection already exists in either direction
    const existing = await Friendship.findOne({
      $or: [
        { requester: user._id, recipient: recipientId },
        { requester: recipientId, recipient: user._id },
      ],
    });

    if (existing) {
      if (existing.status === "accepted") {
        return NextResponse.json(
          { detail: "You are already friends with this user." },
          { status: 400 }
        );
      }
      if (existing.status === "pending") {
        const message =
          existing.requester.toString() === user._id.toString()
            ? "Friend request already sent."
            : "This user has already sent you a friend request.";
        return NextResponse.json({ detail: message }, { status: 400 });
      }

      // Re-send if previously rejected
      existing.requester = user._id;
      existing.recipient = recipientId;
      existing.status = "pending";
      await existing.save();

      return NextResponse.json(
        { message: "Friend request sent.", friendshipId: existing._id },
        { status: 201 }
      );
    }

    const friendship = await Friendship.create({
      requester: user._id,
      recipient: recipientId,
      status: "pending",
    });

    return NextResponse.json(
      { message: "Friend request sent successfully.", friendshipId: friendship._id },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to send friend request." },
      { status: 500 }
    );
  }
}