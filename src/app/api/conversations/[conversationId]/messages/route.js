import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "../../../../../lib/dbConnect";
import Conversation from "../../../../../models/conversation";
import Friendship from "../../../../../models/friendship";
import Message from "../../../../../models/message";
import Notification from "../../../../../models/notification";
import { getAuthenticatedUser } from "../../../../../lib/auth";
import { createNotification } from "../../../../../lib/notifications";

const USER_FIELDS = "firstName lastName username email image";

/**
 * @swagger
 * /api/conversations/{conversationId}/messages:
 * get:
 * summary: Get chronological messages and mark incoming messages as read
 * tags: [Conversations]
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: path
 * name: conversationId
 * required: true
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Message history retrieved
 * 400:
 * description: Invalid conversation ID
 * 401:
 * description: Unauthorized
 * 403:
 * description: Access forbidden
 * 404:
 * description: Conversation not found
 * 500:
 * description: Internal server error
 * post:
 * summary: Send a markdown message in this conversation
 * tags: [Conversations]
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: path
 * name: conversationId
 * required: true
 * schema:
 * type: string
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - content
 * properties:
 * content:
 * type: string
 * description: CommonMark / GFM markdown formatted body
 * responses:
 * 201:
 * description: Message sent successfully
 * 400:
 * description: Message content cannot be empty or invalid ID
 * 401:
 * description: Unauthorized
 * 403:
 * description: Forbidden or friendship is no longer active
 * 404:
 * description: Conversation not found
 * 500:
 * description: Internal server error
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

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return NextResponse.json(
        { detail: "Invalid conversation ID format." },
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
        { detail: "You do not have access to this conversation." },
        { status: 403 }
      );
    }

    // Retrieve all messages ordered chronologically
    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", USER_FIELDS)
      .populate("recipient", USER_FIELDS)
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

    // Also mark any conversation notifications for this thread as read
    await Notification.updateMany(
      {
        conversationId,
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

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return NextResponse.json(
        { detail: "Invalid conversation ID format." },
        { status: 400 }
      );
    }

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

    // Identify recipient
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

    // Determine if this is the first message initiating the conversation
    const isFirstMessage = !conversation.lastMessage;

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

    // Strip markdown symbols for clean notification text
    const cleanSnippet = content
      .replace(/[#*`_~>[\]()]/g, "")
      .trim()
      .slice(0, 60);

    const notificationMessage = isFirstMessage
      ? `@${user.username} started a conversation: "${cleanSnippet}${content.length > 60 ? "..." : ""}"`
      : `@${user.username} sent you a message: "${cleanSnippet}${content.length > 60 ? "..." : ""}"`;

    // Dispatch notification
    await createNotification({
      recipient: recipientId,
      sender: user._id,
      type: "conversation_message",
      conversationId: conversation._id,
      message: notificationMessage,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", USER_FIELDS)
      .populate("recipient", USER_FIELDS)
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