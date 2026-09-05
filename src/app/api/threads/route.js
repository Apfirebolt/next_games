import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "../../../lib/dbConnect";
import { Thread } from "../../../models/thread";
import { Post } from "../../../models/post";
import { Category } from "../../../models/category";
import { getAuthenticatedUser } from "../../../lib/auth";

// Helper: Slug generator
function generateSlug(title) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return `${base}-${Date.now().toString().slice(-4)}`;
}

// Helper: Media sanitizer (Thread-only)
function sanitizeMedia(media) {
  if (
    media?.url &&
    typeof media.url === "string" &&
    media.url.startsWith("https://res.cloudinary.com/")
  ) {
    return {
      url: media.url,
      publicId: typeof media.publicId === "string" ? media.publicId : null,
    };
  }
  return null;
}

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    // Clamp pagination to safe boundaries
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const filter = {};
    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return NextResponse.json(
          { detail: "Invalid category ID format." },
          { status: 400 }
        );
      }
      filter.categoryId = categoryId;
    }

    const [threads, total] = await Promise.all([
      Thread.find(filter)
        .sort({ isPinned: -1, "latestPost.createdAt": -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Thread.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: threads,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { detail: error.message || "Failed to fetch threads." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  let createdThreadId = null;
  let createdPostId = null;

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
    const { categoryId, title, content, media } = body;

    // Validate incoming fields
    if (!categoryId || !title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { detail: "Category ID, title, and opening content are required." },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json(
        { detail: "Invalid category ID format." },
        { status: 400 }
      );
    }

    const categoryExists = await Category.exists({ _id: categoryId });
    if (!categoryExists) {
      return NextResponse.json(
        { detail: "Specified category does not exist." },
        { status: 404 }
      );
    }

    const creator = {
      userId: authUser._id,
      username: authUser.username || authUser.name || "User",
      avatarUrl: authUser.avatarUrl || "",
    };

    // Sanitize Cloudinary payload strictly for Thread
    const cleanMedia =
      media?.url &&
      typeof media.url === "string" &&
      media.url.startsWith("https://res.cloudinary.com/")
        ? {
            url: media.url,
            publicId: typeof media.publicId === "string" ? media.publicId : null,
          }
        : null;

    const now = new Date();
    const threadId = new mongoose.Types.ObjectId();
    const postId = new mongoose.Types.ObjectId();

    // 1. Create Thread (Single write with pre-computed IDs and media)
    const thread = await Thread.create({
      _id: threadId,
      categoryId,
      title: title.trim(),
      slug: generateSlug(title),
      creator,
      replyCount: 0,
      media: cleanMedia,
      latestPost: {
        postId,
        userId: creator.userId,
        username: creator.username,
        avatarUrl: creator.avatarUrl,
        createdAt: now,
      },
    });
    createdThreadId = thread._id;

    // 2. Create Opening Post (no media attached)
    const initialPost = await Post.create({
      _id: postId,
      threadId: thread._id,
      author: creator,
      content: content.trim(),
      parentId: null,
      path: ",",
      depth: 0,
      createdAt: now,
    });
    createdPostId = initialPost._id;

    // 3. Update Category counters & activity pointer
    await Category.findByIdAndUpdate(categoryId, {
      $inc: { threadCount: 1, postCount: 1 },
      $set: {
        lastActivity: {
          threadId: thread._id,
          threadTitle: thread.title,
          userId: creator.userId,
          username: creator.username,
          updatedAt: now,
        },
      },
    });

    return NextResponse.json(
      { success: true, data: { thread, post: initialPost } },
      { status: 201 }
    );
  } catch (error) {
    // Manual cleanup to prevent orphan documents on standalone MongoDB
    if (createdThreadId) {
      await Thread.findByIdAndDelete(createdThreadId).catch(() => {});
    }
    if (createdPostId) {
      await Post.findByIdAndDelete(createdPostId).catch(() => {});
    }

    return NextResponse.json(
      { detail: error.message || "Failed to create thread." },
      { status: 500 }
    );
  }
}