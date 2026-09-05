import { NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import { Category } from "../../../models/category";
import { getAuthenticatedUser } from "../../../lib/auth";

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Retrieve all forum categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       description:
 *                         type: string
 *                       order:
 *                         type: integer
 *                       threadCount:
 *                         type: integer
 *                       postCount:
 *                         type: integer
 *                       lastActivity:
 *                         type: object
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               order:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  try {
    await dbConnect();
    const categories = await Category.find().sort({ order: 1, createdAt: 1 }).lean();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    return NextResponse.json({ detail: error.message || "Failed to fetch categories." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ detail: "Unauthorized access, please login again." }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { title, description, order } = body;

    if (!title) {
      return NextResponse.json({ detail: "Title is required." }, { status: 400 });
    }

    const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    const category = await Category.create({
      title,
      slug,
      description: description || "",
      order: order || 0
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ detail: error.message || "Failed to create category." }, { status: 500 });
  }
}