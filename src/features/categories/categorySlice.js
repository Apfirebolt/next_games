// src/features/categories/categorySlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import categoryService from "./categoryService";
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
  categories: [],
  selectedCategory: null, // Holds the currently active category filter
  isLoading: false,
  isCreateLoading: false, // Dedicated loader for category creation modal/forms
  isError: false,
  isSuccess: false,
  message: "",
};

// 1. Fetch all categories
export const fetchCategories = createAsyncThunk(
  "categories/fetchAll",
  async (_, thunkAPI) => {
    try {
      const response = await categoryService.getCategories();
      return response.data; // Extracts the array from { success: true, data: [...] }
    } catch (error) {
      const message = extractErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 2. Create a new category
export const createCategory = createAsyncThunk(
  "categories/create",
  async (categoryData, thunkAPI) => {
    try {
      const response = await categoryService.createCategory(categoryData);
      toast.success(`Category "${categoryData.title}" created successfully!`);
      return response.data; // Extracts created object from { success: true, data: { ... } }
    } catch (error) {
      const message = extractErrorMessage(error);
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const categorySlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    // Select category for filtering thread lists
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    resetCategoryStatus: (state) => {
      state.isLoading = false;
      state.isCreateLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
    // Optional helper to update category stats locally when a thread is added
    incrementCategoryCounters: (state, action) => {
      const { categoryId, lastActivity } = action.payload;
      const category = state.categories.find((cat) => cat._id === categoryId);
      if (category) {
        category.threadCount = (category.threadCount || 0) + 1;
        category.postCount = (category.postCount || 0) + 1;
        if (lastActivity) {
          category.lastActivity = lastActivity;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Create Category
      .addCase(createCategory.pending, (state) => {
        state.isCreateLoading = true;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.isCreateLoading = false;
        state.isSuccess = true;
        state.categories.push(action.payload);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.isCreateLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const {
  setSelectedCategory,
  resetCategoryStatus,
  incrementCategoryCounters,
} = categorySlice.actions;

export default categorySlice.reducer;