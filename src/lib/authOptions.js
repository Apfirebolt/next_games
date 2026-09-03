// src/lib/authOptions.js
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "./dbConnect";
import User from "../models/user";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        await dbConnect();
        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          const firstName = profile.given_name || user.name?.split(" ")[0] || "User";
          const lastName = profile.family_name || user.name?.split(" ").slice(1).join(" ") || "";

          await User.create({
            firstName,
            lastName,
            email: user.email,
            image: user.image,
            provider: "google",
            username: user.email.split("@")[0] + "_" + Math.floor(1000 + Math.random() * 9000),
          });
        }
      }
      return true;
    },
    async jwt({ token, account, user }) {
      if (account && user) {
        await dbConnect();
        const dbUser = await User.findOne({ email: user.email }).lean();
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.isAdmin = dbUser.isAdmin;
          token.username = dbUser.username;
          token.backendToken = jwt.sign(
            { id: dbUser._id.toString(), email: dbUser.email, isAdmin: dbUser.isAdmin },
            JWT_SECRET,
            { expiresIn: "7d" }
          );
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.isAdmin = token.isAdmin;
        session.user.username = token.username;
        session.user.token = token.backendToken;
      }
      return session;
    },
  },
};