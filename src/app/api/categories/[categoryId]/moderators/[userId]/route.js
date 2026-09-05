import { NextResponse } from "next/server";
import dbConnect from "../../../../../../lib/dbConnect";
import CategoryModerator from "../../../../../../models/categoryModerator";
import User from "../../../../../../models/user";
import { getAuthenticatedUser } from "../../../../../../lib/auth";

/**
 * @swagger
 * /api/categories/{categoryId}/moderators/{userId}:
 *   put:
 *     summary: Update fine-grained permissions for a category moderator (Admin only)
 *     tags: [Category Moderation]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
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
 *               - permissions
 *             properties:
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
 *       200:
 *         description: Moderator permissions updated successfully
 *       400:
 *         description: Permissions object is required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin privileges required
 *       404:
 *         description: Moderator assignment not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Revoke moderator status for a user in a category (Admin only)
 *     tags: [Category Moderation]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Moderator removed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin privileges required
 *       404:
 *         description: Moderator assignment not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(request, { params }) {
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
        { detail: "Forbidden. Admin privileges required to update moderator permissions." },
        { status: 403 }
      );
    }

    const { categoryId, userId } = await params;
    const { permissions } = await request.json();

    if (!permissions || typeof permissions !== "object") {
      return NextResponse.json(
        { detail: "Permissions object is required." },
        { status: 400 }
      );
    }

    const moderator = await CategoryModerator.findOne({ categoryId, userId });
    if (!moderator) {
      return NextResponse.json(
        { detail: "Moderator record not found for this category." },
        { status: 404 }
      );
    }

    // Merge updated permissions into document
    moderator.permissions = {
      ...moderator.permissions.toObject(),
      ...permissions,
    };
    await moderator.save();

    const updated = await CategoryModerator.findById(moderator._id)
      .populate("userId", "firstName lastName username email image")
      .populate("assignedBy", "firstName lastName username")
      .lean();

    return NextResponse.json(
      {
        message: "Moderator permissions updated successfully.",
        moderator: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to update moderator permissions." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
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
        { detail: "Forbidden. Admin privileges required to revoke moderators." },
        { status: 403 }
      );
    }

    const { categoryId, userId } = await params;

    const deleted = await CategoryModerator.findOneAndDelete({
      categoryId,
      userId,
    });

    if (!deleted) {
      return NextResponse.json(
        { detail: "Moderator record not found or already removed." },
        { status: 404 }
      );
    }

    const targetUser = await User.findById(userId).select("username").lean();

    return NextResponse.json(
      {
        message: `@${targetUser?.username || "User"} has been removed as moderator.`,
        categoryId,
        userId,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to revoke moderator assignment." },
      { status: 500 }
    );
  }
}