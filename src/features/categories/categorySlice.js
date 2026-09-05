import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import categoryService from "./categoryService";
import { toast } from "react-toastify";

const extractErrorMessage = (error) => {
  return (
    error.response?.data?.detail ||
    error.response?.data?.message ||
    error.message ||
    error.toString()
  );
};

// Sort helper: order ascending, then fallback to creation date
const sortCategories = (list) => {
  return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

const initialState = {
  categories: [],
  selectedCategory: null,
  isLoading: false,
  isMutationLoading: false, // Unified loader for create, update, and delete actions
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
      // Safely handle both { data: [...] } and raw array responses
      const categoriesArray = Array.isArray(response)
        ? response
        : response?.data || [];
      return sortCategories(categoriesArray);
    } catch (error) {
      const message = extractErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 2. Create a new category (Admin)
export const createCategory = createAsyncThunk(
  "categories/create",
  async (categoryData, thunkAPI) => {
    try {
      const response = await categoryService.createCategory(categoryData);
      toast.success(response.message || `Category "${categoryData.title}" created successfully!`);
      return response.data || response;
    } catch (error) {
      const message = extractErrorMessage(error);
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 3. Update an existing category (Admin)
export const updateCategory = createAsyncThunk(
  "categories/update",
  async ({ categoryId, categoryData }, thunkAPI) => {
    try {
      const response = await categoryService.updateCategory(categoryId, categoryData);
      toast.success(response.message || "Category updated successfully!");
      return response.data || response;
    } catch (error) {
      const message = extractErrorMessage(error);
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 4. Delete a category (Admin)
export const deleteCategory = createAsyncThunk(
  "categories/delete",
  async (categoryId, thunkAPI) => {
    try {
      const response = await categoryService.deleteCategory(categoryId);
      toast.success(response.message || "Category deleted successfully.");
      return { categoryId };
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
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    resetCategoryStatus: (state) => {
      state.isLoading = false;
      state.isMutationLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
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
        state.isMutationLoading = true;
        state.isError = false;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.isMutationLoading = false;
        state.isSuccess = true;
        state.categories.push(action.payload);
        state.categories = sortCategories(state.categories);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.isMutationLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Update Category
      .addCase(updateCategory.pending, (state) => {
        state.isMutationLoading = true;
        state.isError = false;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.isMutationLoading = false;
        state.isSuccess = true;
        const updated = action.payload;
        const index = state.categories.findIndex((c) => c._id === updated._id);
        if (index !== -1) {
          state.categories[index] = updated;
          state.categories = sortCategories(state.categories);
        }
        if (state.selectedCategory?._id === updated._id) {
          state.selectedCategory = updated;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.isMutationLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Delete Category
      .addCase(deleteCategory.pending, (state) => {
        state.isMutationLoading = true;
        state.isError = false;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.isMutationLoading = false;
        state.isSuccess = true;
        const { categoryId } = action.payload;
        state.categories = state.categories.filter((c) => c._id !== categoryId);
        if (state.selectedCategory?._id === categoryId) {
          state.selectedCategory = null;
        }
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.isMutationLoading = false;
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