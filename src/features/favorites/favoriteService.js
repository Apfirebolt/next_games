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

// Check if a specific game is favorited
const checkFavoriteStatus = async (gameId) => {
  const response = await httpClient.get(`${API_URL}/${gameId}`);
  return response.data; // { isFavorited: boolean }
};

const favoriteService = {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavoriteStatus,
};

export default favoriteService;