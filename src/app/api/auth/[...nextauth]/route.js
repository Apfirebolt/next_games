import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "../../../../lib/dbConnect";
import User from "../../../../models/user";

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
        await connectDB();

        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          // Derive first and last name from Google profile
          const firstName = profile.given_name || user.name?.split(" ")[0] || "User";
          const lastName = profile.family_name || user.name?.split(" ").slice(1).join(" ") || "";
          
          await User.create({
            firstName,
            lastName,
            email: user.email,
            image: user.image,
            provider: "google",
            // Generate a default fallback username
            username: user.email.split("@")[0] + "_" + Math.floor(1000 + Math.random() * 9000),
          });
        }
      }
      return true;
    },
    async session({ session }) {
      await connectDB();
      const dbUser = await User.findOne({ email: session.user.email }).lean();

      if (dbUser) {
        session.user.id = dbUser._id.toString();
        session.user.isAdmin = dbUser.isAdmin;
        session.user.username = dbUser.username;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };