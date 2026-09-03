// src/services/userService.js
import httpClient from "../../plugins/interceptor";

const API_URL = "users";

// Get all users
const getAllUsers = async () => {
  const response = await httpClient.get(API_URL);
  return response.data;
};

// Get a specific user by ID
const getUserById = async (userId) => {
  const response = await httpClient.get(`${API_URL}/${userId}`);
  return response.data;
};

const userService = {
  getAllUsers,
  getUserById,
};

export default userService;