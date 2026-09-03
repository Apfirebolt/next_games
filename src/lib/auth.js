// src/lib/auth.js
import jwt from "jsonwebtoken";
import User from "../models/user";
import dbConnect from "./dbConnect";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./authOptions";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

if (!JWT_SECRET) {
  throw new Error("Please define the JWT_SECRET environment variable in .env.local");
}

// Generate JWT token valid for 7 days
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Extract bearer token, verify it, and return the DB user
export const getAuthenticatedUser = async (request) => {
  await dbConnect();

  // 1. Try Bearer Token verification
  const authHeader = request?.headers?.get?.("authorization") || request?.headers?.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1]?.trim();

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password").lean();
        if (user) return user;
      } catch (error) {
        // Token invalid or expired; proceed to NextAuth fallback
      }
    }
  }

  // 2. NextAuth Session fallback (for OAuth/browser cookie requests)
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id || session?.user?.email) {
      const query = session.user.id
        ? { _id: session.user.id }
        : { email: session.user.email };

      return await User.findOne(query).select("-password").lean();
    }
  } catch (error) {
    return null;
  }

  return null;
};