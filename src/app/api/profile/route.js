// src/app/api/profile/route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import User from "../../../models/user";
import { getAuthenticatedUser } from "../../../lib/auth";

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Update profile details (firstName, lastName, username) for the authenticated user
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Bad request or username already in use
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
    const { firstName, lastName, username } = body;

    // Check if at least one field is provided
    if (
      firstName === undefined &&
      lastName === undefined &&
      username === undefined
    ) {
      return NextResponse.json(
        { detail: "Please provide at least one field to update." },
        { status: 400 }
      );
    }

    // Retrieve full user record from DB
    const user = await User.findById(authUser._id);
    if (!user) {
      return NextResponse.json({ detail: "User not found." }, { status: 404 });
    }

    // If username is being changed, verify uniqueness
    if (username !== undefined) {
      const trimmedUsername = username.trim();
      if (!trimmedUsername) {
        return NextResponse.json(
          { detail: "Username cannot be empty." },
          { status: 400 }
        );
      }

      if (trimmedUsername !== user.username) {
        const usernameExists = await User.findOne({
          username: trimmedUsername,
          _id: { $ne: user._id },
        });

        if (usernameExists) {
          return NextResponse.json(
            { detail: "Username is already taken." },
            { status: 400 }
          );
        }
        user.username = trimmedUsername;
      }
    }

    if (firstName !== undefined) {
      user.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      user.lastName = lastName.trim();
    }

    const updatedUser = await user.save();

    return NextResponse.json(
      {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        username: updatedUser.username,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to update profile." },
      { status: 500 }
    );
  }
}