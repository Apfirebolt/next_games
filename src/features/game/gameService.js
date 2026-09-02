import axios from 'axios'

// Get game List
const getGameList = async (page = 1, search = '') => {
  try {
    let API_URL = 'https://softgenie.org/api/games'
    const params = new URLSearchParams();
    if (page) {
      params.append('page', page);
    }
    if (search) {
      params.append('search', search);
    }
    API_URL = `${API_URL}?${params.toString()}`;
    const response = await axios.get(API_URL)
    return response.data
  } catch (err) {
    let errorMessage = 'Something went wrong'
    if (err.response.status === 401) {
      errorMessage = 'Unauthorized access, please login again.'
    }
  }
}

// getGameById
const getGameById = async (id) => {
  try {
    let API_URL = `https://softgenie.org/api/games/${id}`
    const response = await axios.get(API_URL)
    return response.data
  } catch (err) {
    let errorMessage = 'Something went wrong'
    if (err.response.status === 401) {
      errorMessage = 'Unauthorized access, please login again.'
    }
  }
}

const gameService = {
    getGameList,
    getGameById
}

export default gameService
