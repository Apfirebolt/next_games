import mongoose from "mongoose";

const categoryModeratorSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category ID is required"],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    permissions: {
      canPinThreads: { type: Boolean, default: true },
      canLockThreads: { type: Boolean, default: true },
      canDeleteThreads: { type: Boolean, default: true },
      canMoveThreads: { type: Boolean, default: false },
      canEditPosts: { type: Boolean, default: false }, 
      canDeletePosts: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// 1. Ensure a user can only be added once per category
categoryModeratorSchema.index({ categoryId: 1, userId: 1 }, { unique: true });

// 2. Query optimization: quickly fetch all categories moderated by a specific user
categoryModeratorSchema.index({ userId: 1, categoryId: 1 });

export const CategoryModerator =
  mongoose.models.CategoryModerator ||
  mongoose.model("CategoryModerator", categoryModeratorSchema);

export default CategoryModerator;