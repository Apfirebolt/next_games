import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import conversationService from "./conversationService";
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
  conversations: [],
  activeConversation: null, // Currently selected thread
  messages: [], // Message history for active conversation
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSendingMessage: false,
  isError: false,
  isSuccess: false,
  message: "",
};

// 1. Fetch all conversations for inbox
export const fetchConversations = createAsyncThunk(
  "conversations/fetchAll",
  async (_, thunkAPI) => {
    try {
      const response = await conversationService.getConversations();
      return response.conversations;
    } catch (error) {
      const message = extractErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 2. Start or find a conversation with a friend
export const startConversation = createAsyncThunk(
  "conversations/start",
  async (recipientId, thunkAPI) => {
    try {
      const response = await conversationService.startConversation(recipientId);
      return response.conversation;
    } catch (error) {
      const message = extractErrorMessage(error);
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 3. Fetch message history for a conversation
export const fetchMessages = createAsyncThunk(
  "conversations/fetchMessages",
  async (conversationId, thunkAPI) => {
    try {
      const response = await conversationService.getMessages(conversationId);
      return { conversationId, messages: response.messages };
    } catch (error) {
      const message = extractErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 4. Send a markdown message
export const sendMessage = createAsyncThunk(
  "conversations/sendMessage",
  async ({ conversationId, content }, thunkAPI) => {
    try {
      const response = await conversationService.sendMessage(conversationId, content);
      return response.message;
    } catch (error) {
      const message = extractErrorMessage(error);
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const conversationSlice = createSlice({
  name: "conversations",
  initialState,
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
    },
    clearActiveConversation: (state) => {
      state.activeConversation = null;
      state.messages = [];
    },
    resetConversationStatus: (state) => {
      state.isLoadingConversations = false;
      state.isLoadingMessages = false;
      state.isSendingMessage = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Conversations
      .addCase(fetchConversations.pending, (state) => {
        state.isLoadingConversations = true;
        state.isError = false;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoadingConversations = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoadingConversations = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Start Conversation
      .addCase(startConversation.pending, (state) => {
        state.isLoadingConversations = true;
      })
      .addCase(startConversation.fulfilled, (state, action) => {
        state.isLoadingConversations = false;
        const conv = action.payload;
        state.activeConversation = conv;

        // Upsert in conversations list
        const exists = state.conversations.some((c) => c._id === conv._id);
        if (!exists) {
          state.conversations.unshift(conv);
        }
      })
      .addCase(startConversation.rejected, (state, action) => {
        state.isLoadingConversations = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.isLoadingMessages = true;
        state.isError = false;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoadingMessages = false;
        state.messages = action.payload.messages;

        // Reset unread count for this conversation in the inbox list
        const conv = state.conversations.find(
          (c) => c._id === action.payload.conversationId
        );
        if (conv) {
          conv.unreadCount = 0;
        }
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoadingMessages = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.isSendingMessage = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isSendingMessage = false;
        const sentMessage = action.payload;

        // Append to active message thread
        state.messages.push(sentMessage);

        // Update lastMessage and bump conversation to the top
        const convIndex = state.conversations.findIndex(
          (c) => c._id === sentMessage.conversation
        );
        if (convIndex !== -1) {
          const conv = state.conversations[convIndex];
          conv.lastMessage = sentMessage;
          conv.lastMessageAt = sentMessage.createdAt;

          // Move to top of array
          state.conversations.splice(convIndex, 1);
          state.conversations.unshift(conv);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSendingMessage = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const {
  setActiveConversation,
  clearActiveConversation,
  resetConversationStatus,
} = conversationSlice.actions;

export default conversationSlice.reducer;