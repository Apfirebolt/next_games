import { NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import Conversation from "../../../models/conversation";
import Friendship from "../../../models/friendship";
import Message from "../../../models/message";
import User from "../../../models/user";
import { getAuthenticatedUser } from "../../../lib/auth";

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Retrieve conversations for current user
 *     tags: [Conversations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations returned successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Start or find conversation with a friend
 *     tags: [Conversations]
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
 *       200:
 *         description: Conversation retrieved or initialized
 *       400:
 *         description: Missing fields or self-conversation attempted
 *       403:
 *         description: Must be accepted friends to converse
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

    const conversations = await Conversation.find({
      participants: user._id,
    })
      .populate("participants", "firstName lastName username email image")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 })
      .lean();

    // Compute unread count per conversation for the current user
    const conversationList = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipant = conv.participants.find(
          (p) => p._id.toString() !== user._id.toString()
        );

        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          recipient: user._id,
          isRead: false,
        });

        return {
          _id: conv._id,
          friendshipId: conv.friendship,
          participant: otherParticipant || null,
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt,
          unreadCount,
        };
      })
    );

    return NextResponse.json({ conversations: conversationList }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to retrieve conversations." },
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
        { detail: "You cannot initiate a conversation with yourself." },
        { status: 400 }
      );
    }

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return NextResponse.json(
        { detail: "Recipient user not found." },
        { status: 404 }
      );
    }

    // Guard: Must be accepted friends in Friendship collection
    const activeFriendship = await Friendship.findOne({
      $or: [
        { requester: user._id, recipient: recipientId },
        { requester: recipientId, recipient: user._id },
      ],
      status: "accepted",
    });

    if (!activeFriendship) {
      return NextResponse.json(
        { detail: "You can only message users who are in your accepted friends list." },
        { status: 403 }
      );
    }

    // Locate existing conversation or instantiate a new one
    let conversation = await Conversation.findOne({
      participants: { $all: [user._id, recipientId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [user._id, recipientId],
        friendship: activeFriendship._id,
        lastMessageAt: new Date(),
      });
    }

    const populated = await Conversation.findById(conversation._id)
      .populate("participants", "firstName lastName username email image")
      .populate("lastMessage")
      .lean();

    return NextResponse.json(
      { conversation: populated },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to start or retrieve conversation." },
      { status: 500 }
    );
  }
}