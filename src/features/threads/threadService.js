// src/features/threads/threadService.js
import httpClient from "../../plugins/interceptor";

const API_URL = "threads";

// Get paginated threads, optionally filtered by categoryId
const getThreads = async ({ categoryId = "", page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams();
  if (categoryId) params.append("categoryId", categoryId);
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);

  const response = await httpClient.get(`${API_URL}?${params.toString()}`);
  return response.data; // Expected: { success: true, data: [...], pagination: { total, page, pages } }
};

// Get a single thread by ID (increments views count)
const getThreadById = async (threadId) => {
  const response = await httpClient.get(`${API_URL}/${threadId}`);
  return response.data; // Expected: { success: true, data: { ... } }
};

// Create a new thread along with its opening post
const createThread = async (threadData) => {
  const response = await httpClient.post(API_URL, threadData);
  return response.data; // Expected: { success: true, data: { thread: { ... }, post: { ... } } }
};

const threadService = {
  getThreads,
  getThreadById,
  createThread,
};

export default threadService;