import { configureStore } from '@reduxjs/toolkit'
import gameReducer from './features/game/gameSlice'
import authReducer from './features/auth/authSlice'

export const store = configureStore({
  reducer: {
    game: gameReducer,
    auth: authReducer,
  },
})