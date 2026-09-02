import { configureStore } from '@reduxjs/toolkit'
import gameReducer from './features/game/gameSlice'
import authReducer from './features/auth/authSlice'
import favoriteReducer from './features/favorites/favoriteSlice'

export const makeStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      game: gameReducer,
      auth: authReducer,
      favorites: favoriteReducer,
    },
    preloadedState,
  });
};

// Fallback singleton for standard client calls if needed
export const store = makeStore();