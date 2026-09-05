import httpClient from "../../plugins/interceptor";

const API_URL = "posts";

// Fetch all posts/replies for a specific thread (supports mode: 'tree' | 'flat')
const getPostsByThreadId = async (threadId, mode = "tree") => {
  const response = await httpClient.get(`${API_URL}?threadId=${threadId}&mode=${mode}`);
  return response.data; // Expected: { success: true, data: [...] }
};

// Create a new post or reply (with optional quote, parentId, and media)
const createPost = async (postData) => {
  const response = await httpClient.post(API_URL, postData);
  return response.data; // Expected: { success: true, data: { ... } }
};

// Delete a post by ID
const deletePost = async (postId) => {
  const response = await httpClient.delete(`${API_URL}/${postId}`);
  return response.data; // Expected: { success: true, message: "..." }
};

const postService = {
  getPostsByThreadId,
  createPost,
  deletePost,
};

export default postService;