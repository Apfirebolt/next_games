// src/app/api/login/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/user";
import { generateToken } from "@/lib/auth";

export async function POST(request) {
  try {
    await dbConnect();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { detail: "Email and password are required." },
        { status: 400 }
      );
    }

    // Locate user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user || !(await user.matchPassword(password))) {
      return NextResponse.json(
        { detail: "Invalid email or password." },
        { status: 400 }
      );
    }

    const access = generateToken(user._id);

    return NextResponse.json(
      {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        access,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Internal server error during login." },
      { status: 500 }
    );
  }
}