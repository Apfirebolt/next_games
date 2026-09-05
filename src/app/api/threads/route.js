import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "../../../lib/dbConnect";
import { Thread } from "../../../models/thread";
import { Post } from "../../../models/post";
import { Category } from "../../../models/category";
import { getAuthenticatedUser } from "../../../lib/auth";

/**
 * @swagger
 * /api/threads:
 *   get:
 *     summary: Get paginated threads, optionally filtered by category
 *     tags: [Threads]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of category
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated threads retrieved successfully
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new thread along with its opening post
 *     tags: [Threads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryId
 *               - title
 *               - content
 *             properties:
 *               categoryId:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               media:
 *                 type: object
 *                 properties:
 *                   url:
 *                     type: string
 *                   publicId:
 *                     type: string
 *     responses:
 *       201:
 *         description: Thread and initial post created successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const filter = categoryId ? { categoryId } : {};

    const threads = await Thread.find(filter)
      .sort({ isPinned: -1, "latestPost.createdAt": -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Thread.countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: threads,
      pagination: { total, page, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    return NextResponse.json({ detail: error.message || "Failed to fetch threads." }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json({ detail: "Unauthorized access, please login again." }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { categoryId, title, content, media } = body;

    if (!categoryId || !title || !content) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json({ detail: "Category ID, title, and content are required." }, { status: 400 });
    }

    const creator = {
      userId: authUser._id,
      username: authUser.username || authUser.name || "User",
      avatarUrl: authUser.avatarUrl || ""
    };

    const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    const [thread] = await Thread.create([{
      categoryId,
      title,
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      creator,
      replyCount: 0
    }], { session });

    const [initialPost] = await Post.create([{
      threadId: thread._id,
      author: creator,
      content,
      media: media || { url: null, publicId: null },
      parentId: null,
      path: ",",
      depth: 0
    }], { session });

    thread.latestPost = {
      postId: initialPost._id,
      userId: creator.userId,
      username: creator.username,
      avatarUrl: creator.avatarUrl,
      createdAt: initialPost.createdAt
    };
    await thread.save({ session });

    await Category.findByIdAndUpdate(categoryId, {
      $inc: { threadCount: 1, postCount: 1 },
      $set: {
        lastActivity: {
          threadId: thread._id,
          threadTitle: thread.title,
          userId: creator.userId,
          username: creator.username,
          updatedAt: new Date()
        }
      }
    }, { session });

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({ success: true, data: { thread, post: initialPost } }, { status: 201 });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return NextResponse.json({ detail: error.message || "Failed to create thread." }, { status: 500 });
  }
}