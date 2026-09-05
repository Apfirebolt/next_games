import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/dbConnect";
import CategoryModerator from "../../../../../models/categoryModerator";
import Category from "../../../../../models/category";
import User from "../../../../../models/user";
import { getAuthenticatedUser } from "../../../../../lib/auth";

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
 *         description: User is already a moderator of this category or missing fields
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

    const categoryExists = await Category.findById(categoryId).lean();
    if (!categoryExists) {
      return NextResponse.json(
        { detail: "Category not found." },
        { status: 404 }
      );
    }

    const moderators = await CategoryModerator.find({ categoryId })
      .populate("userId", "firstName lastName username email image")
      .populate("assignedBy", "firstName lastName username")
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

    // Admin authorization guard
    if (!user.isAdmin) {
      return NextResponse.json(
        { detail: "Forbidden. Admin privileges required to assign moderators." },
        { status: 403 }
      );
    }

    const { categoryId } = await params;
    const body = await request.json();
    const { userId, permissions = {} } = body;

    if (!userId) {
      return NextResponse.json(
        { detail: "userId is required to assign a moderator." },
        { status: 400 }
      );
    }

    // Verify category existence
    const category = await Category.findById(categoryId);
    if (!category) {
      return NextResponse.json(
        { detail: "Category not found." },
        { status: 404 }
      );
    }

    // Verify target user existence
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { detail: "User to be assigned as moderator was not found." },
        { status: 404 }
      );
    }

    // Check if user is already assigned to this category
    const existing = await CategoryModerator.findOne({ categoryId, userId });
    if (existing) {
      return NextResponse.json(
        { detail: `@${targetUser.username} is already a moderator for this category.` },
        { status: 400 }
      );
    }

    // Create assignment
    const moderator = await CategoryModerator.create({
      categoryId,
      userId,
      assignedBy: user._id,
      permissions: {
        canPinThreads: permissions.canPinThreads ?? true,
        canLockThreads: permissions.canLockThreads ?? true,
        canDeleteThreads: permissions.canDeleteThreads ?? true,
        canMoveThreads: permissions.canMoveThreads ?? false,
        canEditPosts: permissions.canEditPosts ?? false,
        canDeletePosts: permissions.canDeletePosts ?? true,
      },
    });

    const populated = await CategoryModerator.findById(moderator._id)
      .populate("userId", "firstName lastName username email image")
      .populate("assignedBy", "firstName lastName username")
      .lean();

    return NextResponse.json(
      {
        message: `@${targetUser.username} assigned as moderator successfully.`,
        moderator: populated,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to assign category moderator." },
      { status: 500 }
    );
  }
}