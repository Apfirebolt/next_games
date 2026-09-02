// src/app/api/register/route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import User from "../../../models/user";
import { generateToken } from "../../../lib/auth";

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - username
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccess'
 *       400:
 *         description: Validation error or duplicate email/username
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function POST(request) {
  try {
    await dbConnect();
    const { firstName, lastName, username, email, password } = await request.json();

    // 1. Validation
    if (!firstName || !lastName || !username || !email || !password) {
      return NextResponse.json(
        { detail: "Please provide all required fields." },
        { status: 400 }
      );
    }

    // 2. Check for duplicate email or username
    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return NextResponse.json(
        { detail: "A user with this email already exists." },
        { status: 400 }
      );
    }

    const existingUsername = await User.findOne({ username: username.trim() });
    if (existingUsername) {
      return NextResponse.json(
        { detail: "A user with this username already exists." },
        { status: 400 }
      );
    }

    // 3. Create user (password hashing runs in pre-save hook)
    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      password,
    });

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
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Internal server error during registration." },
      { status: 500 }
    );
  }
}