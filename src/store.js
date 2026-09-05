import { configureStore } from '@reduxjs/toolkit'
import gameReducer from './features/game/gameSlice'
import authReducer from './features/auth/authSlice'
import favoriteReducer from './features/favorites/favoriteSlice'
import userReducer from './features/user/userSlice'
import recommendationReducer from './features/recommendations/recommendationSlice'
import categoryReducer from './features/categories/categorySlice'
import threadReducer from './features/threads/threadSlice'

export const makeStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      game: gameReducer,
      auth: authReducer,
      favorites: favoriteReducer,
      user: userReducer,
      recommendations: recommendationReducer,
      categories: categoryReducer,
      threads: threadReducer,
    },
    preloadedState,
  });
};

// Fallback singleton for standard client calls if needed
export const store = makeStore();