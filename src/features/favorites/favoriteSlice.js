// src/features/favorites/favoriteSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import favoriteService from "./favoriteService";
import { toast } from "react-toastify";

// Helper to extract human-readable error messages
const extractErrorMessage = (error) => {
  return (
    error.response?.data?.detail ||
    error.response?.data?.message ||
    error.message ||
    error.toString()
  );
};

const initialState = {
  favorites: [],
  favoriteIds: [], // Handy array of numbers to quickly check `favoriteIds.includes(gameId)`
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
};

// 1. Fetch user's favorites
export const fetchFavorites = createAsyncThunk(
  "favorites/fetchAll",
  async (_, thunkAPI) => {
    try {
      return await favoriteService.getFavorites();
    } catch (error) {
      const message = extractErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 2. Add a game to favorites
export const addFavorite = createAsyncThunk(
  "favorites/add",
  async (gameData, thunkAPI) => {
    try {
      const data = await favoriteService.addFavorite(gameData);
      toast.success(`"${gameData.title}" added to favorites!`);
      return data;
    } catch (error) {
      const message = extractErrorMessage(error);
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 3. Remove a game from favorites
export const removeFavorite = createAsyncThunk(
  "favorites/remove",
  async (gameId, thunkAPI) => {
    try {
      await favoriteService.removeFavorite(gameId);
      toast.info("Removed from favorites");
      return gameId;
    } catch (error) {
      const message = extractErrorMessage(error);
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const favoriteSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {
    resetFavorites: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
    clearFavoritesOnLogout: (state) => {
      state.favorites = [];
      state.favoriteIds = [];
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Favorites
      .addCase(fetchFavorites.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.favorites = action.payload;
        state.favoriteIds = action.payload.map((fav) => fav.gameId);
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Add Favorite
      .addCase(addFavorite.fulfilled, (state, action) => {
        state.favorites.unshift(action.payload);
        state.favoriteIds.push(action.payload.gameId);
      })

      // Remove Favorite
      .addCase(removeFavorite.fulfilled, (state, action) => {
        const removedGameId = Number(action.payload);
        state.favorites = state.favorites.filter(
          (item) => item.gameId !== removedGameId
        );
        state.favoriteIds = state.favoriteIds.filter(
          (id) => id !== removedGameId
        );
      });
  },
});

export const { resetFavorites, clearFavoritesOnLogout } = favoriteSlice.actions;
export default favoriteSlice.reducer;