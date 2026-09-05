// src/features/favorites/favoriteService.js
import httpClient from "../../plugins/interceptor";

const API_URL = "favorites";

// Get all favorite games for the authenticated user
const getFavorites = async () => {
  const response = await httpClient.get(API_URL);
  return response.data;
};

// Add a game to favorites
const addFavorite = async (gameData) => {
  const response = await httpClient.post(API_URL, gameData);
  return response.data;
};

// Remove a game from favorites by external gameId
const removeFavorite = async (gameId) => {
  const response = await httpClient.delete(`${API_URL}/${gameId}`);
  return response.data;
};

// Check if a specific game is favorited and fetch review if present
const checkFavoriteStatus = async (gameId) => {
  const response = await httpClient.get(`${API_URL}/${gameId}`);
  return response.data;
};

// Add or update a review for a favorited game
const saveReview = async (gameId, reviewData) => {
  const response = await httpClient.put(`${API_URL}/${gameId}`, reviewData);
  return response.data;
};

// Remove only the review from a favorited game (retains favorite status)
const removeReview = async (gameId) => {
  const response = await httpClient.patch(`${API_URL}/${gameId}`);
  return response.data;
};

const favoriteService = {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavoriteStatus,
  saveReview,
  removeReview,
};

export default favoriteService;