import httpClient from "../../plugins/interceptor";

const API_URL = "categories";

// 1. Fetch all categories
const getCategories = async () => {
  const response = await httpClient.get(API_URL);
  return response.data; // Expected: { success: true, data: [...] } or direct array
};

// 2. Create a new category (Admin)
const createCategory = async (categoryData) => {
  const response = await httpClient.post(API_URL, categoryData);
  return response.data; // Expected: { message: string, data: { ... } }
};

// 3. Update an existing category (Admin)
const updateCategory = async (categoryId, categoryData) => {
  const response = await httpClient.put(`${API_URL}/${categoryId}`, categoryData);
  return response.data; // Expected: { message: string, data: { ... } }
};

// 4. Delete a category (Admin)
const deleteCategory = async (categoryId) => {
  const response = await httpClient.delete(`${API_URL}/${categoryId}`);
  return response.data; // Expected: { message: string, categoryId: string }
};

const categoryService = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};

export default categoryService;