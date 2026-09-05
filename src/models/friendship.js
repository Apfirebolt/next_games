import mongoose from "mongoose";

const friendshipSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate active requests between the same two users in the same direction
friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });

const Friendship =
  mongoose.models.Friendship || mongoose.model("Friendship", friendshipSchema);

export default Friendship;