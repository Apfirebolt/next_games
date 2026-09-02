import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import gameService from "./gameService";

const initialState = {
  gameList: [],
  game: {},
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

// Get Multiple games
export const getGames = createAsyncThunk(
  "game/list",
  async (params, thunkAPI) => {
    try {
      return await gameService.getGameList(params.page, params.search);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const getGameById = createAsyncThunk(
  "game/detail",
  async (id, thunkAPI) => {
    try {
      return await gameService.getGameById(id);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    reset: () => initialState,
    resetVariables: (state) => {
      state.isError = false;
      state.isLoading = false;
      state.isSuccess = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getGames.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getGames.fulfilled, (state, action) => {
        state.isLoading = false;
        state.gameList = action.payload;
      })
      .addCase(getGames.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getGameById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getGameById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.game = action.payload;
      })
      .addCase(getGameById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, resetVariables } = gameSlice.actions;
export default gameSlice.reducer;