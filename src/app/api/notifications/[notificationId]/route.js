import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import Notification from "../../../../models/notification";
import { getAuthenticatedUser } from "../../../../lib/auth";

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

    const { notificationId } = await params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: user._id },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json(
        { detail: "Notification not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ notification }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to update notification." },
      { status: 500 }
    );
  }
}