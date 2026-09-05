import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "../../../../../lib/dbConnect";
import CategoryModerator from "../../../../../models/categoryModerator";
import Category from "../../../../../models/category";
import User from "../../../../../models/user";
import { getAuthenticatedUser } from "../../../../../lib/auth";

const USER_PROJECTION = "firstName lastName username email image";
const ASSIGNED_BY_PROJECTION = "firstName lastName username";

const DEFAULT_PERMISSIONS = {
  canPinThreads: true,
  canLockThreads: true,
  canDeleteThreads: true,
  canMoveThreads: false,
  canEditPosts: false,
  canDeletePosts: true,
};

function formatPermissions(customPermissions = {}) {
  const formatted = {};
  for (const [key, defaultValue] of Object.entries(DEFAULT_PERMISSIONS)) {
    formatted[key] =
      typeof customPermissions[key] === "boolean"
        ? customPermissions[key]
        : defaultValue;
  }
  return formatted;
}

/**
 * @swagger
 * /api/categories/{categoryId}/moderators:
 *   get:
 *     summary: Retrieve all moderators assigned to a specific category
 *     tags: [Category Moderation]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of category moderators returned successfully
 *       400:
 *         description: Invalid category ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Assign a user as moderator to a category (Admin only)
 *     tags: [Category Moderation]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
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
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *               permissions:
 *                 type: object
 *                 properties:
 *                   canPinThreads:
 *                     type: boolean
 *                   canLockThreads:
 *                     type: boolean
 *                   canDeleteThreads:
 *                     type: boolean
 *                   canMoveThreads:
 *                     type: boolean
 *                   canEditPosts:
 *                     type: boolean
 *                   canDeletePosts:
 *                     type: boolean
 *     responses:
 *       201:
 *         description: Moderator assigned successfully
 *       400:
 *         description: User is already a moderator of this category or invalid ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin privileges required
 *       404:
 *         description: Category or User not found
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

    const { categoryId } = await params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json(
        { detail: "Invalid category ID format." },
        { status: 400 }
      );
    }

    const categoryExists = await Category.exists({ _id: categoryId });
    if (!categoryExists) {
      return NextResponse.json(
        { detail: "Category not found." },
        { status: 404 }
      );
    }

    const moderators = await CategoryModerator.find({ categoryId })
      .populate("userId", USER_PROJECTION)
      .populate("assignedBy", ASSIGNED_BY_PROJECTION)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ moderators }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to retrieve category moderators." },
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

    if (!user.isAdmin) {
      return NextResponse.json(
        { detail: "Forbidden. Admin privileges required to assign moderators." },
        { status: 403 }
      );
    }

    const { categoryId } = await params;
    const body = await request.json();
    const { userId, permissions } = body;

    if (!userId) {
      return NextResponse.json(
        { detail: "userId is required to assign a moderator." },
        { status: 400 }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(categoryId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return NextResponse.json(
        { detail: "Invalid categoryId or userId format." },
        { status: 400 }
      );
    }

    // Parallel validation for target entities
    const [category, targetUser] = await Promise.all([
      Category.findById(categoryId).select("_id title").lean(),
      User.findById(userId).select("_id username").lean(),
    ]);

    if (!category) {
      return NextResponse.json(
        { detail: "Category not found." },
        { status: 404 }
      );
    }

    if (!targetUser) {
      return NextResponse.json(
        { detail: "User to be assigned as moderator was not found." },
        { status: 404 }
      );
    }

    // Check if user is already assigned
    const existing = await CategoryModerator.findOne({ categoryId, userId }).lean();
    if (existing) {
      return NextResponse.json(
        { detail: `@${targetUser.username} is already a moderator for this category.` },
        { status: 400 }
      );
    }

    // Create record
    const [moderator] = await CategoryModerator.create([
      {
        categoryId,
        userId,
        assignedBy: user._id,
        permissions: formatPermissions(permissions),
      },
    ]);

    const populated = await CategoryModerator.findById(moderator._id)
      .populate("userId", USER_PROJECTION)
      .populate("assignedBy", ASSIGNED_BY_PROJECTION)
      .lean();

    return NextResponse.json(
      {
        message: `@${targetUser.username} assigned as moderator successfully.`,
        moderator: populated,
      },
      { status: 201 }
    );
  } catch (error) {
    // Catch compound unique index collision if simultaneous requests hit the route
    if (error.code === 11000) {
      return NextResponse.json(
        { detail: "This user is already a moderator for this category." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { detail: error.message || "Failed to assign category moderator." },
      { status: 500 }
    );
  }
}