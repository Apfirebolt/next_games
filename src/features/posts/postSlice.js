// src/features/posts/postSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import postService from "./postService";
import { updateThreadLatestPost } from "../threads/threadSlice";
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
  posts: [],
  activeQuote: null, // Holds { originalPostId, authorName, selectedText }
  replyToParentId: null, // Targeted post ID when clicking "Reply" on a specific nested comment
  isLoading: false,
  isSubmitLoading: false,
  isDeleteLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
};

// 1. Fetch posts by thread ID
export const fetchPostsByThread = createAsyncThunk(
  "posts/fetchByThread",
  async ({ threadId, mode = "tree" }, thunkAPI) => {
    try {
      const response = await postService.getPostsByThreadId(threadId, mode);
      return response.data;
    } catch (error) {
      const message = extractErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 2. Submit a post / nested reply
export const createPost = createAsyncThunk(
  "posts/create",
  async (postData, thunkAPI) => {
    try {
      const response = await postService.createPost(postData);
      const newPost = response.data;

      // Sync thread's latest post snapshot & counter in the thread slice
      thunkAPI.dispatch(
        updateThreadLatestPost({
          threadId: postData.threadId,
          latestPost: {
            postId: newPost._id,
            userId: newPost.author.userId,
            username: newPost.author.username,
            avatarUrl: newPost.author.avatarUrl,
            createdAt: newPost.createdAt,
          },
        })
      );

      toast.success("Reply posted!");
      return newPost;
    } catch (error) {
      const message = extractErrorMessage(error);
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 3. Delete a post
export const deletePost = createAsyncThunk(
  "posts/delete",
  async (postId, thunkAPI) => {
    try {
      await postService.deletePost(postId);
      toast.info("Post deleted");
      return postId;
    } catch (error) {
      const message = extractErrorMessage(error);
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const postSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    // Set active selection to quote into the reply editor
    setActiveQuote: (state, action) => {
      state.activeQuote = action.payload; // { originalPostId, authorName, selectedText }
    },
    clearActiveQuote: (state) => {
      state.activeQuote = null;
    },
    // Set target parent post for nested branching
    setReplyToParentId: (state, action) => {
      state.replyToParentId = action.payload;
    },
    clearReplyToParentId: (state) => {
      state.replyToParentId = null;
    },
    clearPosts: (state) => {
      state.posts = [];
      state.activeQuote = null;
      state.replyToParentId = null;
    },
    resetPostStatus: (state) => {
      state.isLoading = false;
      state.isSubmitLoading = false;
      state.isDeleteLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Posts
      .addCase(fetchPostsByThread.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchPostsByThread.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.posts = action.payload;
      })
      .addCase(fetchPostsByThread.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Create Post
      .addCase(createPost.pending, (state) => {
        state.isSubmitLoading = true;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.isSubmitLoading = false;
        state.isSuccess = true;
        
        const newPost = action.payload;

        // If it's a child reply, insert directly after its parent/sibling branch
        if (newPost.parentId) {
          const parentIndex = state.posts.findIndex((p) => p._id === newPost.parentId);
          if (parentIndex !== -1) {
            // Find last descendant belonging to this path
            let insertIndex = parentIndex + 1;
            while (
              insertIndex < state.posts.length &&
              state.posts[insertIndex].path.includes(newPost.parentId)
            ) {
              insertIndex++;
            }
            state.posts.splice(insertIndex, 0, newPost);
          } else {
            state.posts.push(newPost);
          }
        } else {
          // Top-level reply appends at the end
          state.posts.push(newPost);
        }

        // Reset active quote and targeted parent after submission
        state.activeQuote = null;
        state.replyToParentId = null;
      })
      .addCase(createPost.rejected, (state, action) => {
        state.isSubmitLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Delete Post
      .addCase(deletePost.pending, (state) => {
        state.isDeleteLoading = true;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.isDeleteLoading = false;
        const deletedId = action.payload;
        state.posts = state.posts.filter((post) => post._id !== deletedId);
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.isDeleteLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const {
  setActiveQuote,
  clearActiveQuote,
  setReplyToParentId,
  clearReplyToParentId,
  clearPosts,
  resetPostStatus,
} = postSlice.actions;

export default postSlice.reducer;