// src/features/categories/categoryService.js
import httpClient from "../../plugins/interceptor";

const API_URL = "categories";

// Fetch all categories (sorted by order/creation)
const getCategories = async () => {
  const response = await httpClient.get(API_URL);
  return response.data; // Expected: { success: true, data: [...] }
};

// Create a new category (admin / authorized user)
const createCategory = async (categoryData) => {
  const response = await httpClient.post(API_URL, categoryData);
  return response.data; // Expected: { success: true, data: { ... } }
};

const categoryService = {
  getCategories,
  createCategory,
};

export default categoryService;