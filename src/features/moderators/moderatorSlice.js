import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import moderatorService from "./moderatorService";
import { toast } from "react-toastify";

const extractErrorMessage = (error) => {
  return (
    error.response?.data?.detail ||
    error.response?.data?.message ||
    error.message ||
    error.toString()
  );
};

const initialState = {
  moderators: [], // Active moderators for the currently inspected category
  isLoading: false,
  isActionLoading: false, // For assign, update, and revoke mutations
  isError: false,
  isSuccess: false,
  message: "",
};

// 1. Fetch all moderators for a category
export const fetchCategoryModerators = createAsyncThunk(
  "moderators/fetchByCategory",
  async (categoryId, thunkAPI) => {
    try {
      const response = await moderatorService.getCategoryModerators(categoryId);
      return response.moderators;
    } catch (error) {
      const message = extractErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 2. Assign a user as a category moderator
export const assignModerator = createAsyncThunk(
  "moderators/assign",
  async ({ categoryId, userId, permissions }, thunkAPI) => {
    try {
      const response = await moderatorService.assignCategoryModerator(
        categoryId,
        { userId, permissions }
      );
      toast.success(response.message || "Moderator assigned successfully!");
      return response.moderator;
    } catch (error) {
      const message = extractErrorMessage(error);
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 3. Update permissions for a category moderator
export const updatePermissions = createAsyncThunk(
  "moderators/updatePermissions",
  async ({ categoryId, userId, permissions }, thunkAPI) => {
    try {
      const response = await moderatorService.updateModeratorPermissions(
        categoryId,
        userId,
        permissions
      );
      toast.success(response.message || "Permissions updated successfully!");
      return response.moderator;
    } catch (error) {
      const message = extractErrorMessage(error);
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 4. Revoke moderator assignment
export const revokeModerator = createAsyncThunk(
  "moderators/revoke",
  async ({ categoryId, userId }, thunkAPI) => {
    try {
      const response = await moderatorService.revokeCategoryModerator(
        categoryId,
        userId
      );
      toast.success(response.message || "Moderator removed successfully.");
      return { categoryId, userId };
    } catch (error) {
      const message = extractErrorMessage(error);
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const moderatorSlice = createSlice({
  name: "moderators",
  initialState,
  reducers: {
    clearModerators: (state) => {
      state.moderators = [];
      state.isLoading = false;
      state.isActionLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
    resetModeratorStatus: (state) => {
      state.isLoading = false;
      state.isActionLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Category Moderators
      .addCase(fetchCategoryModerators.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchCategoryModerators.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.moderators = action.payload;
      })
      .addCase(fetchCategoryModerators.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Assign Moderator
      .addCase(assignModerator.pending, (state) => {
        state.isActionLoading = true;
        state.isError = false;
      })
      .addCase(assignModerator.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.isSuccess = true;
        // Prepend to local moderator list
        state.moderators.unshift(action.payload);
      })
      .addCase(assignModerator.rejected, (state, action) => {
        state.isActionLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Update Permissions
      .addCase(updatePermissions.pending, (state) => {
        state.isActionLoading = true;
        state.isError = false;
      })
      .addCase(updatePermissions.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.isSuccess = true;
        const updated = action.payload;
        const index = state.moderators.findIndex((m) => m._id === updated._id);
        if (index !== -1) {
          state.moderators[index] = updated;
        }
      })
      .addCase(updatePermissions.rejected, (state, action) => {
        state.isActionLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Revoke Moderator
      .addCase(revokeModerator.pending, (state) => {
        state.isActionLoading = true;
        state.isError = false;
      })
      .addCase(revokeModerator.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.isSuccess = true;
        const { userId } = action.payload;
        state.moderators = state.moderators.filter(
          (m) => (m.userId?._id || m.userId?.id || m.userId) !== userId
        );
      })
      .addCase(revokeModerator.rejected, (state, action) => {
        state.isActionLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { clearModerators, resetModeratorStatus } = moderatorSlice.actions;

export default moderatorSlice.reducer;