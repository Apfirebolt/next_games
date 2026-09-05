import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "../../../lib/dbConnect";
import { Post } from "../../../models/post";
import { Thread } from "../../../models/thread";
import { Category } from "../../../models/category";
import { getAuthenticatedUser } from "../../../lib/auth";
import { createNotification } from "../../../lib/notifications";

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Retrieve posts for a thread in flat or nested tree order
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *         description: The MongoDB ObjectId of the thread
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [tree, flat]
 *           default: tree
 *         description: Ordering structure
 *     responses:
 *       200:
 *         description: List of posts retrieved
 *       400:
 *         description: Thread ID is required or invalid
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Reply to a thread with optional quote, media, parent hierarchy, and notification generation
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - threadId
 *               - content
 *             properties:
 *               threadId:
 *                 type: string
 *               content:
 *                 type: string
 *               parentId:
 *                 type: string
 *                 nullable: true
 *               quote:
 *                 type: object
 *                 properties:
 *                   originalPostId:
 *                     type: string
 *                   authorName:
 *                     type: string
 *                   selectedText:
 *                     type: string
 *               media:
 *                 type: object
 *                 properties:
 *                   url:
 *                     type: string
 *                   publicId:
 *                     type: string
 *     responses:
 *       201:
 *         description: Post submitted successfully
 *       400:
 *         description: Missing fields or invalid ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Thread is locked
 *       404:
 *         description: Thread not found
 *       500:
 *         description: Internal server error
 */
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get("threadId");
    const mode = searchParams.get("mode") || "tree";

    if (!threadId) {
      return NextResponse.json(
        { detail: "threadId query parameter is required." },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(threadId)) {
      return NextResponse.json(
        { detail: "Invalid threadId format." },
        { status: 400 }
      );
    }

    const sortQuery =
      mode === "tree" ? { path: 1, createdAt: 1 } : { createdAt: 1 };
    const posts = await Post.find({ threadId }).sort(sortQuery).lean();

    return NextResponse.json({ success: true, data: posts });
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to fetch posts." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
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
    const { threadId, content, media, quote, parentId } = body;

    if (!threadId || !content || !content.trim()) {
      return NextResponse.json(
        { detail: "Thread ID and content are required." },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(threadId)) {
      return NextResponse.json(
        { detail: "Invalid threadId format." },
        { status: 400 }
      );
    }

    if (parentId && !mongoose.Types.ObjectId.isValid(parentId)) {
      return NextResponse.json(
        { detail: "Invalid parentId format." },
        { status: 400 }
      );
    }

    const thread = await Thread.findById(threadId);
    if (!thread) {
      return NextResponse.json(
        { detail: "Thread not found." },
        { status: 404 }
      );
    }

    if (thread.isLocked) {
      return NextResponse.json(
        { detail: "This thread is locked." },
        { status: 403 }
      );
    }

    const author = {
      userId: authUser._id,
      username: authUser.username || authUser.name || "User",
      avatarUrl: authUser.avatarUrl || authUser.image || "",
    };

    // 1. Create and save the post
    const newPost = new Post({
      threadId,
      author,
      content: content.trim(),
      media: media || { url: null, publicId: null },
      quote: quote || {
        originalPostId: null,
        authorName: null,
        selectedText: null,
      },
      parentId: parentId || null,
    });

    await newPost.save();

    // 2. Update Thread counters and latestPost preview
    await Thread.findByIdAndUpdate(threadId, {
      $inc: { replyCount: 1 },
      $set: {
        latestPost: {
          postId: newPost._id,
          userId: author.userId,
          username: author.username,
          avatarUrl: author.avatarUrl,
          createdAt: newPost.createdAt,
        },
      },
    });

    // 3. Update Category counters and lastActivity metadata
    await Category.findByIdAndUpdate(thread.categoryId, {
      $inc: { postCount: 1 },
      $set: {
        lastActivity: {
          threadId: thread._id,
          threadTitle: thread.title,
          userId: author.userId,
          username: author.username,
          updatedAt: new Date(),
        },
      },
    });

    // 4. Generate Notifications
    const currentUserIdStr = authUser._id.toString();
    const threadCreatorIdStr = thread.creator.userId.toString();
    let parentAuthorIdStr = null;

    // Snippet preview for notification texts
    const cleanSnippet = content
      .replace(/[#*`_~>[\]()]/g, "")
      .trim()
      .slice(0, 50);
    const contentPreview = `"${cleanSnippet}${content.length > 50 ? "..." : ""}"`;

    // Case A: Reply to a parent comment
    if (parentId) {
      const parentPost = await Post.findById(parentId).select("author").lean();
      if (parentPost?.author?.userId) {
        parentAuthorIdStr = parentPost.author.userId.toString();

        if (parentAuthorIdStr !== currentUserIdStr) {
          await createNotification({
            recipient: parentPost.author.userId,
            sender: authUser._id,
            type: "comment_reply",
            threadId: thread._id,
            postId: newPost._id,
            message: `@${author.username} replied to your comment: ${contentPreview}`,
          });
        }
      }
    }

    // Case B: Reply to the thread creator
    // Suppress if the user replied to their own thread or if the thread creator already got a comment_reply
    if (
      threadCreatorIdStr !== currentUserIdStr &&
      threadCreatorIdStr !== parentAuthorIdStr
    ) {
      await createNotification({
        recipient: thread.creator.userId,
        sender: authUser._id,
        type: "thread_reply",
        threadId: thread._id,
        postId: newPost._id,
        message: `@${author.username} replied to your thread "${thread.title}": ${contentPreview}`,
      });
    }

    return NextResponse.json(
      { success: true, data: newPost },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to post reply." },
      { status: 500 }
    );
  }
}