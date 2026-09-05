import httpClient from "../../plugins/interceptor";

// 1. Fetch moderators for a specific category
const getCategoryModerators = async (categoryId) => {
  const response = await httpClient.get(`categories/${categoryId}/moderators`);
  return response.data; // Expected: { moderators: [...] }
};

// 2. Assign a moderator to a category (Admin only)
const assignCategoryModerator = async (categoryId, { userId, permissions }) => {
  const response = await httpClient.post(`categories/${categoryId}/moderators`, {
    userId,
    permissions,
  });
  return response.data; // Expected: { message: string, moderator: { ... } }
};

// 3. Update permissions for an existing category moderator (Admin only)
const updateModeratorPermissions = async (categoryId, userId, permissions) => {
  const response = await httpClient.put(
    `categories/${categoryId}/moderators/${userId}`,
    { permissions }
  );
  return response.data; // Expected: { message: string, moderator: { ... } }
};

// 4. Revoke/remove a moderator from a category (Admin only)
const revokeCategoryModerator = async (categoryId, userId) => {
  const response = await httpClient.delete(
    `categories/${categoryId}/moderators/${userId}`
  );
  return response.data; // Expected: { message: string, categoryId, userId }
};

const moderatorService = {
  getCategoryModerators,
  assignCategoryModerator,
  updateModeratorPermissions,
  revokeCategoryModerator,
};

export default moderatorService;