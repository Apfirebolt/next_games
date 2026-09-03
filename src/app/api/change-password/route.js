// src/app/api/change-password/route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import User from "../../../models/user";
import { getAuthenticatedUser } from "../../../lib/auth";

/**
 * @swagger
 * /api/change-password:
 *   put:
 *     summary: Update password for the authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid current password or validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function PUT(request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { detail: "Unauthorized access, please login again." },
        { status: 401 }
      );
    }

    await dbConnect();
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { detail: "Current password and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { detail: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Fetch user with password field (getAuthenticatedUser uses .select("-password"))
    const user = await User.findById(authUser._id);
    if (!user) {
      return NextResponse.json({ detail: "User not found." }, { status: 404 });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return NextResponse.json(
        { detail: "Incorrect current password." },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { detail: "New password cannot be identical to current password." },
        { status: 400 }
      );
    }

    // Assigning triggers the Mongoose pre-save hash middleware
    user.password = newPassword;
    await user.save();

    return NextResponse.json(
      { message: "Password updated successfully." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to update password." },
      { status: 500 }
    );
  }
}