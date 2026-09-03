import httpClient from "../../plugins/interceptor";

const API_URL = "similar";
const USER_API_URL = "recommendations/user";

const extractErrorMessage = (err) => {
  if (err.response) {
    const { status, data } = err.response;
    if (status === 401) {
      return "Unauthorized access, please login again.";
    }
    if (data?.error) {
      return data.error;
    }
    if (data?.detail) {
      return data.detail;
    }
    if (data?.message) {
      return data.message;
    }
  }
  return err.message || "Something went wrong";
};

const getSimilarGamesById = async (gameId) => {
  try {
    const response = await httpClient.get(`${API_URL}/${gameId}`);
    return response.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

const getUserRecommendations = async () => {
  try {
    const response = await httpClient.get(USER_API_URL);
    return response.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

const recommendationService = {
  getSimilarGamesById,
  getUserRecommendations,
};

export default recommendationService;