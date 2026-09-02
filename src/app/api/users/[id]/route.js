// src/app/api/users/[id]/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/user";
import { getAuthenticatedUser } from "@/lib/auth";

// GET user profile by ID
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { detail: "Unauthorized access, please login again." },
        { status: 401 }
      );
    }

    // Optional safety: restrict viewing only to the user themselves or an admin
    if (authUser._id.toString() !== id && !authUser.isAdmin) {
      return NextResponse.json(
        { detail: "Forbidden: You cannot access this profile." },
        { status: 403 }
      );
    }

    const user = await User.findById(id).select("-password");
    if (!user) {
      return NextResponse.json(
        { detail: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Internal server error." },
      { status: 500 }
    );
  }
}

// PUT / update profile by ID
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { detail: "Unauthorized access, please login again." },
        { status: 401 }
      );
    }

    // Ensure users can only update their own record
    if (authUser._id.toString() !== id && !authUser.isAdmin) {
      return NextResponse.json(
        { detail: "Forbidden: You cannot modify this profile." },
        { status: 403 }
      );
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { detail: "User not found." },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Check for username collision if changed
    if (body.username && body.username !== user.username) {
      const usernameExists = await User.findOne({ username: body.username.trim() });
      if (usernameExists) {
        return NextResponse.json(
          { detail: "Username is already taken." },
          { status: 400 }
        );
      }
      user.username = body.username.trim();
    }

    // Check for email collision if changed
    if (body.email && body.email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: body.email.toLowerCase().trim() });
      if (emailExists) {
        return NextResponse.json(
          { detail: "Email is already taken." },
          { status: 400 }
        );
      }
      user.email = body.email.toLowerCase().trim();
    }

    user.firstName = body.firstName || user.firstName;
    user.lastName = body.lastName || user.lastName;

    // Update password if provided (pre-save hook will hash it)
    if (body.password) {
      user.password = body.password;
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