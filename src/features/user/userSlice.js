// src/features/user/userSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import userService from "./userService";

const extractErrorMessage = (error) => {
  return (
    error.response?.data?.detail ||
    error.response?.data?.message ||
    error.message ||
    error.toString()
  );
};

const initialState = {
  users: [],
  selectedUser: null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
};

// 1. Fetch all users
export const fetchAllUsers = createAsyncThunk(
  "user/fetchAll",
  async (_, thunkAPI) => {
    try {
      return await userService.getAllUsers();
    } catch (error) {
      const message = extractErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 2. Fetch specific user by ID
export const fetchUserById = createAsyncThunk(
  "user/fetchById",
  async (userId, thunkAPI) => {
    try {
      return await userService.getUserById(userId);
    } catch (error) {
      const message = extractErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    resetUserState: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Users
      .addCase(fetchAllUsers.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.users = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Fetch User By ID
      .addCase(fetchUserById.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.selectedUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetUserState, clearSelectedUser } = userSlice.actions;
export default userSlice.reducer;