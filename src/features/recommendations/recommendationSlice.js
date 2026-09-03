import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import recommendationClientService from "./recommendationService";

// Async thunk: Similar games by specific game ID
export const getSimilarGames = createAsyncThunk(
  "recommendations/getSimilarGames",
  async (gameId, { rejectWithValue }) => {
    try {
      return await recommendationClientService.getSimilarGamesById(gameId);
    } catch (err) {
      return rejectWithValue({ gameId, message: err.message });
    }
  },
  {
    condition: (gameId, { getState }) => {
      const { recommendations } = getState();
      const existing = recommendations?.byGameId?.[gameId];
      if (existing && (existing.status === "loading" || existing.status === "succeeded")) {
        return false;
      }
      return true;
    },
  }
);

// Async thunk: Recommendations based on user favorites
export const getUserRecommendations = createAsyncThunk(
  "recommendations/getUserRecommendations",
  async (_, { rejectWithValue }) => {
    try {
      return await recommendationClientService.getUserRecommendations();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = {
  userRecommendations: {
    items: [],
    isEligible: false,
    requiredCount: 3,
    currentCount: 0,
    targetCount: 0,
    message: "",
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  byGameId: {},
};

const recommendationSlice = createSlice({
  name: "recommendations",
  initialState,
  reducers: {
    clearRecommendationCache: (state) => {
      state.byGameId = {};
    },
    resetUserRecommendations: (state) => {
      state.userRecommendations = initialState.userRecommendations;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Similar Games by ID ---
      .addCase(getSimilarGames.pending, (state, action) => {
        const gameId = action.meta.arg;
        state.byGameId[gameId] = {
          target: null,
          similar: [],
          status: "loading",
          error: null,
        };
      })
      .addCase(getSimilarGames.fulfilled, (state, action) => {
        const gameId = action.meta.arg;
        const { game, similarGames } = action.payload || {};

        state.byGameId[gameId] = {
          target: game || null,
          similar: similarGames || [],
          status: "succeeded",
          error: null,
        };
      })
      .addCase(getSimilarGames.rejected, (state, action) => {
        const gameId = action.meta.arg;
        state.byGameId[gameId] = {
          target: null,
          similar: [],
          status: "failed",
          error: action.payload?.message || "Failed to load similar titles",
        };
      })

      // --- User Recommendations (Based on Favorites) ---
      .addCase(getUserRecommendations.pending, (state) => {
        state.userRecommendations.status = "loading";
        state.userRecommendations.error = null;
      })
      .addCase(getUserRecommendations.fulfilled, (state, action) => {
        const {
          isEligible = false,
          currentCount = 0,
          requiredCount = 3,
          targetCount = 0,
          recommendations = [],
          message = "",
        } = action.payload || {};

        state.userRecommendations.status = "succeeded";
        state.userRecommendations.isEligible = isEligible;
        state.userRecommendations.currentCount = currentCount;
        state.userRecommendations.requiredCount = requiredCount;
        state.userRecommendations.targetCount = targetCount;
        state.userRecommendations.items = recommendations;
        state.userRecommendations.message = message;
        state.userRecommendations.error = null;
      })
      .addCase(getUserRecommendations.rejected, (state, action) => {
        state.userRecommendations.status = "failed";
        state.userRecommendations.error = action.payload || "Failed to load recommendations";
      });
  },
});

export const { clearRecommendationCache, resetUserRecommendations } = recommendationSlice.actions;

// Selectors
const DEFAULT_BY_ID = { target: null, similar: [], status: "idle", error: null };

export const selectSimilarByGameId = (state, gameId) =>
  state.recommendations?.byGameId?.[gameId] || DEFAULT_BY_ID;

export const selectUserRecommendations = (state) =>
  state.recommendations?.userRecommendations || initialState.userRecommendations;

export default recommendationSlice.reducer;