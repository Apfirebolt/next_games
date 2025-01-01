import axios from 'axios'
const API_URL = 'https://softgenie.org/api/games'

// Get game List
const getGameList = async () => {
  try {
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
