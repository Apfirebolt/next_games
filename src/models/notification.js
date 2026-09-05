import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "friend_request_sent",
        "friend_request_accepted",
        "thread_reply",
        "comment_reply",
        "conversation_message"
      ],
      required: true,
      index: true,
    },
    conversationId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Conversation",
  default: null,
},
    // Contextual references
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
      default: null,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    friendshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Friendship",
      default: null,
    },
    // Human-readable snippet or description
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Optimize feed sorting & unread badge counters
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;