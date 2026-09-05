import Notification from "../models/notification";

/**
 * Dispatch a notification if the recipient is not the action initiator.
 */
export async function createNotification({
  recipient,
  sender,
  type,
  message,
  threadId = null,
  postId = null,
  friendshipId = null,
}) {
  try {
    // Suppress self-notifications
    if (recipient.toString() === sender.toString()) {
      return null;
    }

    return await Notification.create({
      recipient,
      sender,
      type,
      message,
      threadId,
      postId,
      friendshipId,
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}