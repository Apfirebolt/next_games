// src/features/threads/threadSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import threadService from "./threadService";
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
  threads: [],
  currentThread: null,
  pagination: {
    total: 0,
    page: 1,
    pages: 1,
  },
  viewMode: "table", // "table" | "card"
  isLoading: false,
  isThreadDetailLoading: false,
  isCreateLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
};

// 1. Fetch paginated threads (optionally by category)
export const fetchThreads = createAsyncThunk(
  "threads/fetchAll",
  async (queryParams, thunkAPI) => {
    try {
      return await threadService.getThreads(queryParams);
    } catch (error) {
      const message = extractErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 2. Fetch single thread by ID
export const fetchThreadById = createAsyncThunk(
  "threads/fetchById",
  async (threadId, thunkAPI) => {
    try {
      const response = await threadService.getThreadById(threadId);
      return response.data;
    } catch (error) {
      const message = extractErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 3. Create a new thread
export const createThread = createAsyncThunk(
  "threads/create",
  async (threadData, thunkAPI) => {
    try {
      const response = await threadService.createThread(threadData);
      toast.success("Thread created successfully!");
      return response.data; // Contains { thread, post }
    } catch (error) {
      const message = extractErrorMessage(error);
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const threadSlice = createSlice({
  name: "threads",
  initialState,
  reducers: {
    // Toggle between table view and card view
    setViewMode: (state, action) => {
      state.viewMode = action.payload; // "table" | "card"
    },
    clearCurrentThread: (state) => {
      state.currentThread = null;
    },
    resetThreadState: (state) => {
      state.isLoading = false;
      state.isThreadDetailLoading = false;
      state.isCreateLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
    // Update thread reply count and latestPost snapshot when a new post is added
    updateThreadLatestPost: (state, action) => {
      const { threadId, latestPost } = action.payload;
      const thread = state.threads.find((t) => t._id === threadId);
      if (thread) {
        thread.replyCount = (thread.replyCount || 0) + 1;
        thread.latestPost = latestPost;
      }
      if (state.currentThread && state.currentThread._id === threadId) {
        state.currentThread.replyCount = (state.currentThread.replyCount || 0) + 1;
        state.currentThread.latestPost = latestPost;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Threads
      .addCase(fetchThreads.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchThreads.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.threads = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchThreads.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Fetch Thread By ID
      .addCase(fetchThreadById.pending, (state) => {
        state.isThreadDetailLoading = true;
        state.isError = false;
      })
      .addCase(fetchThreadById.fulfilled, (state, action) => {
        state.isThreadDetailLoading = false;
        state.isSuccess = true;
        state.currentThread = action.payload;
      })
      .addCase(fetchThreadById.rejected, (state, action) => {
        state.isThreadDetailLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Create Thread
      .addCase(createThread.pending, (state) => {
        state.isCreateLoading = true;
      })
      .addCase(createThread.fulfilled, (state, action) => {
        state.isCreateLoading = false;
        state.isSuccess = true;
        state.threads.unshift(action.payload.thread);
        state.pagination.total += 1;
      })
      .addCase(createThread.rejected, (state, action) => {
        state.isCreateLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const {
  setViewMode,
  clearCurrentThread,
  resetThreadState,
  updateThreadLatestPost,
} = threadSlice.actions;

export default threadSlice.reducer;