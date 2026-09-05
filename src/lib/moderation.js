import CategoryModerator from "../models/categoryModerator";
import Thread from "../models/thread";

/**
 * Check if a user has moderation authority over a category.
 *
 * @param {Object} user - Authenticated user object (must have _id, isAdmin)
 * @param {string|ObjectId} categoryId - Target category
 * @param {string} [requiredPermission] - e.g., 'canLockThreads', 'canDeletePosts'
 * @returns {Promise<boolean>}
 */
export async function canModerateCategory(user, categoryId, requiredPermission = null) {
  if (!user || !categoryId) return false;

  // Global site administrators bypass category restrictions
  if (user.isAdmin) return true;

  const assignment = await CategoryModerator.findOne({
    categoryId,
    userId: user._id,
  }).lean();

  if (!assignment) return false;

  if (requiredPermission) {
    return Boolean(assignment.permissions?.[requiredPermission]);
  }

  return true;
}

/**
 * Helper to check moderator permission directly from a threadId
 */
export async function canModerateThread(user, threadId, requiredPermission = null) {
  if (!user || !threadId) return false;
  if (user.isAdmin) return true;

  const thread = await Thread.findById(threadId).select("categoryId").lean();
  if (!thread) return false;

  return canModerateCategory(user, thread.categoryId, requiredPermission);
}