import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "./authService";
import Cookies from "js-cookie";

// Helper: Extract human-readable error for rejectWithValue
const extractErrorMessage = (error) => {
  return (
    error.response?.data?.detail ||
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    error.toString()
  );
};

// Initial state remains neutral; StoreProvider seeds initialUser during store creation
const initialState = {
  user: null,
  profile: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
  // Dedicated status flags for password management
  passwordLoading: false,
  passwordSuccess: false,
  passwordError: false,
  passwordMessage: "",
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
  Cookies.remove("user");
});

// Update User Profile
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

// Change User Password
export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (passwords, thunkAPI) => {
    try {
      return await authService.changePassword(passwords);
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
      state.passwordLoading = false;
      state.passwordSuccess = false;
      state.passwordError = false;
      state.passwordMessage = "";
    },
    // Synchronizes Google/NextAuth session into the Redux state and cookies
    setCredentials: (state, action) => {
      state.user = action.payload;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";

      if (typeof window !== "undefined" && action.payload) {
        Cookies.set("user", JSON.stringify(action.payload), { expires: 7 });
      }
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
        state.isError = false;
        state.isSuccess = false;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.profile = action.payload;
        if (state.user) {
          state.user = {
            ...state.user,
            ...action.payload,
            access: state.user.access,
          };
          if (typeof window !== "undefined") {
            Cookies.set("user", JSON.stringify(state.user), { expires: 7 });
          }
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.passwordLoading = true;
        state.passwordError = false;
        state.passwordSuccess = false;
        state.passwordMessage = "";
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.passwordLoading = false;
        state.passwordSuccess = true;
        state.passwordMessage =
          action.payload?.message || "Password updated successfully";
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.passwordLoading = false;
        state.passwordError = true;
        state.passwordMessage = action.payload;
      })

      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.profile = null;
        state.isSuccess = false;
        state.isError = false;
        state.message = "";
        state.passwordLoading = false;
        state.passwordSuccess = false;
        state.passwordError = false;
        state.passwordMessage = "";
      });
  },
});

export const { reset, setCredentials } = authSlice.actions;
export default authSlice.reducer;