import { NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import Notification from "../../../models/notification";
import { getAuthenticatedUser } from "../../../lib/auth";

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications and unread count
 *       401:
 *         description: Unauthorized
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications marked as read
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

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: user._id })
        .populate("sender", "firstName lastName username image")
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      Notification.countDocuments({ recipient: user._id, isRead: false }),
    ]);

    return NextResponse.json({ notifications, unreadCount }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to retrieve notifications." },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    await dbConnect();
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { detail: "Unauthorized access. Please log in." },
        { status: 401 }
      );
    }

    await Notification.updateMany(
      { recipient: user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return NextResponse.json(
      { message: "All notifications marked as read." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to mark notifications as read." },
      { status: 500 }
    );
  }
}