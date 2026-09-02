// src/lib/auth.js
import jwt from "jsonwebtoken";
import User from "@/models/user";
import dbConnect from "@/lib/dbConnect";

const JWT_SECRET = process.env.JWT_SECRET;

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

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    return user;
  } catch (error) {
    return null;
  }
};