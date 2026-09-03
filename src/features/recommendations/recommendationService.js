import httpClient from "../../plugins/interceptor";

const API_URL = "games";

const getSimilarGamesById = async (gameId) => {
  try {
    const response = await httpClient.get(`${API_URL}/${gameId}/similar`);
    return response.data;
  } catch (err) {
    let errorMessage = "Something went wrong";
    if (err.response) {
      const { status, data } = err.response;
      if (status === 401) {
        errorMessage = "Unauthorized access, please login again.";
      } else if (data?.detail) {
        errorMessage = data.detail;
      } else if (data?.message) {
        errorMessage = data.message;
      }
    }
    throw new Error(errorMessage);
  }
};

const getUserRecommendations = async (limit = 12) => {
  try {
    const response = await httpClient.get(
      `${API_URL}/recommendations?limit=${limit}`,
    );
    return response.data;
  } catch (err) {
    let errorMessage = "Something went wrong";
    if (err.response) {
      const { status, data } = err.response;
      if (status === 401) {
        errorMessage = "Unauthorized access, please login again.";
      } else if (data?.detail) {
        errorMessage = data.detail;
      } else if (data?.message) {
        errorMessage = data.message;
      }
    }
    throw new Error(errorMessage);
  }
};

const recommendationService = {
  getSimilarGamesById,
  getUserRecommendations,
};

export default recommendationService;
