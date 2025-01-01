import axios from 'axios'

// Get game List
const getGameList = async (page = 1) => {
  try {
    let API_URL = 'https://softgenie.org/api/games'
    if (page > 1) {
      API_URL = `${API_URL}?page=${page}`
    }
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
}

export default gameService
