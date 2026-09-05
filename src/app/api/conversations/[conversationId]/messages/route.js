import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/dbConnect";
import Conversation from "../../../../../models/conversation";
import Friendship from "../../../../../models/friendship";
import Message from "../../../../../models/message";
import { getAuthenticatedUser } from "../../../../../lib/auth";

/**
 * @swagger
 * /api/conversations/{conversationId}/messages:
 *   get:
 *     summary: Get chronological messages and mark incoming messages as read
 *     tags: [Conversations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message history retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access forbidden
 *       404:
 *         description: Conversation not found
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Send a markdown message in this conversation
 *     tags: [Conversations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: CommonMark / GFM markdown formatted body
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Message content cannot be empty
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden or friendship is no longer active
 *       404:
 *         description: Conversation not found
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

    const { conversationId } = await params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { detail: "Conversation not found." },
        { status: 404 }
      );
    }

    const isMember = conversation.participants.some(
      (p) => p.toString() === user._id.toString()
    );

    if (!isMember) {
      return NextResponse.json(
        { detail: "You do not have access to this conversation." },
        { status: 403 }
      );
    }

    // Retrieve all messages ordered chronologically
    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "firstName lastName username email image")
      .populate("recipient", "firstName lastName username email image")
      .sort({ createdAt: 1 })
      .lean();

    // Mark any unread messages sent to the current user as read
    await Message.updateMany(
      {
        conversation: conversationId,
        recipient: user._id,
        isRead: false,
      },
      {
        $set: { isRead: true, readAt: new Date() },
      }
    );

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to retrieve messages." },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    await dbConnect();
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { detail: "Unauthorized access. Please log in." },
        { status: 401 }
      );
    }

    const { conversationId } = await params;
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { detail: "Message content cannot be empty." },
        { status: 400 }
      );
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { detail: "Conversation not found." },
        { status: 404 }
      );
    }

    const isMember = conversation.participants.some(
      (p) => p.toString() === user._id.toString()
    );

    if (!isMember) {
      return NextResponse.json(
        { detail: "You do not have permission to send messages here." },
        { status: 403 }
      );
    }

    // Identify other participant
    const recipientId = conversation.participants.find(
      (p) => p.toString() !== user._id.toString()
    );

    // Verify friendship status is still valid and accepted
    const friendshipCheck = await Friendship.findOne({
      _id: conversation.friendship,
      status: "accepted",
    });

    if (!friendshipCheck) {
      return NextResponse.json(
        { detail: "Cannot send message. Active friendship is no longer established." },
        { status: 403 }
      );
    }

    // Create the markdown message
    const message = await Message.create({
      conversation: conversation._id,
      sender: user._id,
      recipient: recipientId,
      content: content.trim(),
      isRead: false,
    });

    // Update conversation metadata
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "firstName lastName username email image")
      .populate("recipient", "firstName lastName username email image")
      .lean();

    return NextResponse.json(
      { message: populatedMessage },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to send message." },
      { status: 500 }
    );
  }
}