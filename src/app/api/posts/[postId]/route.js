import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import dbConnect from "../../../../lib/dbConnect";
import { Post } from "../../../../models/post";
import { getAuthenticatedUser } from "../../../../lib/auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * @swagger
 * /api/posts/{postId}:
 *   delete:
 *     summary: Delete a post and remove its associated Cloudinary asset
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the post to delete
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - cannot delete another user's post
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(request, { params }) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ detail: "Unauthorized access, please login again." }, { status: 401 });
    }

    await dbConnect();
    const { postId } = params;

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ detail: "Post not found." }, { status: 404 });
    }

    // Ensure only the author or an admin can delete
    if (post.author.userId.toString() !== authUser._id.toString() && !authUser.isAdmin) {
      return NextResponse.json({ detail: "Forbidden - you cannot delete this post." }, { status: 403 });
    }

    if (post.media?.publicId) {
      await cloudinary.uploader.destroy(post.media.publicId);
    }

    await Post.findByIdAndDelete(postId);

    return NextResponse.json({ success: true, message: "Post deleted successfully." });
  } catch (error) {
    return NextResponse.json({ detail: error.message || "Failed to delete post." }, { status: 500 });
  }
}