import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "./authService";
import Cookies from "js-cookie";

// SSR-Safe cookie retrieval for Next.js
const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const item = Cookies.get("user");
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error("Failed to parse user cookie:", error);
    return null;
  }
};

// Helper: Extract human-readable error for rejectWithValue
const extractErrorMessage = (error) => {
  return (
    error.response?.data?.detail ||
    error.response?.data?.message ||
    error.message ||
    error.toString()
  );
};

const initialState = {
  user: typeof window !== "undefined" ? getStoredUser() : null,
  profile: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

// Register new user
export const register = createAsyncThunk(
  "auth/register",
  async (userData, thunkAPI) => {
    try {
      return await authService.register(userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(extractErrorMessage(error));
    }
  }
);

// Login user
export const login = createAsyncThunk(
  "auth/login",
  async (userData, thunkAPI) => {
    try {
      return await authService.login(userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(extractErrorMessage(error));
    }
  }
);

// Logout user
export const logout = createAsyncThunk("auth/logout", async () => {
  authService.logout();
});

// Update User Profile (No manual token extraction needed)
export const updateUserProfile = createAsyncThunk(
  "auth/profile",
  async (userData, thunkAPI) => {
    try {
      return await authService.updateProfile(userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
      })

      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
      })

      // Update Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.profile = action.payload;
        if (state.user) {
          state.user = { ...state.user, ...action.payload };
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.profile = null;
        state.isSuccess = false;
        state.isError = false;
        state.message = "";
      });
  },
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;