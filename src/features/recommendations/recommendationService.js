import httpClient from "../../plugins/interceptor";

const API_URL = "similar";

const getSimilarGamesById = async (gameId) => {
  try {
    const response = await httpClient.get(`${API_URL}/${gameId}`);
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
};

export default recommendationService;
