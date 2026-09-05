import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import User from "../../../../models/user";
import Category from "../../../../models/category";
import Thread from "../../../../models/thread";
import Post from "../../../../models/post";
import CategoryModerator from "../../../../models/categoryModerator";
import { getAuthenticatedUser } from "../../../../lib/auth";

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Retrieve aggregated administrative and platform analytics
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics and distributions aggregated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin privileges required
 *       500:
 *         description: Internal server error
 */
export async function GET(request) {
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
        { detail: "Forbidden. Administrator privileges required." },
        { status: 403 }
      );
    }

    // 1. High-level entity counters
    const [
      totalUsers,
      totalAdmins,
      totalCategories,
      totalThreads,
      totalPosts,
      totalModeratorAssignments,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isAdmin: true }),
      Category.countDocuments(),
      Thread.countDocuments(),
      Post.countDocuments(),
      CategoryModerator.countDocuments(),
    ]);

    // 2. Auth Provider Breakdown (Credentials vs OAuth)
    const providerStats = await User.aggregate([
      {
        $group: {
          _id: "$provider",
          count: { $sum: 1 },
        },
      },
    ]);

    // 3. User Signups over the past 30 days (Daily grouping)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const userRegistrationTimeline = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 4. Category-level content distribution (Threads & Posts per category)
    const categoryDistribution = await Category.find()
      .select("title slug threadCount postCount")
      .sort({ postCount: -1 })
      .lean();

    // 5. Most active threads by reply volume
    const topThreads = await Thread.find()
      .select("title viewsCount replyCount createdAt")
      .sort({ replyCount: -1 })
      .limit(5)
      .lean();

    return NextResponse.json(
      {
        overview: {
          totalUsers,
          totalAdmins,
          totalCategories,
          totalThreads,
          totalPosts,
          totalModeratorAssignments,
        },
        providerStats,
        userRegistrationTimeline,
        categoryDistribution,
        topThreads,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to load administrative analytics." },
      { status: 500 }
    );
  }
}