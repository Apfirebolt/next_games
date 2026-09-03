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

// Async thunk: Feed recommendations for current user
export const getUserRecommendations = createAsyncThunk(
  "recommendations/getUserRecommendations",
  async (limit = 12, { rejectWithValue }) => {
    try {
      return await recommendationClientService.getUserRecommendations(limit);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = {
  feed: {
    items: [],
    isPersonalized: false,
    status: "idle",
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
        // Key by the original dispatched argument (gameId) for consistent cache hits
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

      // --- Feed / User Recommendations ---
      .addCase(getUserRecommendations.pending, (state) => {
        state.feed.status = "loading";
        state.feed.error = null;
      })
      .addCase(getUserRecommendations.fulfilled, (state, action) => {
        state.feed.status = "succeeded";
        state.feed.items = action.payload?.recommendations || [];
        state.feed.isPersonalized = Boolean(action.payload?.isPersonalized);
      })
      .addCase(getUserRecommendations.rejected, (state, action) => {
        state.feed.status = "failed";
        state.feed.error = action.payload || "Failed to load feed recommendations";
      });
  },
});

export const { clearRecommendationCache } = recommendationSlice.actions;

// Selectors
export const selectSimilarByGameId = (state, gameId) =>
  state.recommendations?.byGameId?.[gameId] || {
    target: null,
    similar: [],
    status: "idle",
    error: null,
  };

export const selectRecommendationFeed = (state) => state.recommendations.feed;

export default recommendationSlice.reducer;