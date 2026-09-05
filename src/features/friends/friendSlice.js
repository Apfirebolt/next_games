import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import friendService from "./friendService";
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
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
  isLoading: false,
  isActionLoading: false, // Dedicated loader for accept/reject/delete actions
  isError: false,
  isSuccess: false,
  message: "",
};

// 1. Fetch accepted friends
export const fetchFriends = createAsyncThunk(
  "friends/fetchFriends",
  async (_, thunkAPI) => {
    try {
      const response = await friendService.getFriends("accepted");
      return response.friends;
    } catch (error) {
      const message = extractErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 2. Fetch incoming pending requests
export const fetchIncomingRequests = createAsyncThunk(
  "friends/fetchIncomingRequests",
  async (_, thunkAPI) => {
    try {
      const response = await friendService.getFriends("incoming");
      return response.requests;
    } catch (error) {
      const message = extractErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 3. Fetch outgoing pending requests
export const fetchOutgoingRequests = createAsyncThunk(
  "friends/fetchOutgoingRequests",
  async (_, thunkAPI) => {
    try {
      const response = await friendService.getFriends("outgoing");
      return response.requests;
    } catch (error) {
      const message = extractErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 4. Send a friend request
export const sendFriendRequest = createAsyncThunk(
  "friends/sendRequest",
  async (recipientId, thunkAPI) => {
    try {
      const response = await friendService.sendFriendRequest(recipientId);
      toast.success(response.message || "Friend request sent!");
      return response;
    } catch (error) {
      const message = extractErrorMessage(error);
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 5. Respond to a request (accept or reject)
export const respondToFriendRequest = createAsyncThunk(
  "friends/respondToRequest",
  async ({ friendshipId, action }, thunkAPI) => {
    try {
      const response = await friendService.respondToRequest(friendshipId, action);
      toast.success(response.message || `Request ${action}ed successfully.`);
      return { friendshipId, action, status: response.status };
    } catch (error) {
      const message = extractErrorMessage(error);
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 6. Remove friend or cancel request
export const deleteFriendship = createAsyncThunk(
  "friends/deleteFriendship",
  async (friendshipId, thunkAPI) => {
    try {
      const response = await friendService.removeFriendship(friendshipId);
      toast.success(response.message || "Removed successfully.");
      return { friendshipId };
    } catch (error) {
      const message = extractErrorMessage(error);
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const friendSlice = createSlice({
  name: "friends",
  initialState,
  reducers: {
    resetFriendStatus: (state) => {
      state.isLoading = false;
      state.isActionLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Friends
      .addCase(fetchFriends.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.friends = action.payload;
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Fetch Incoming Requests
      .addCase(fetchIncomingRequests.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchIncomingRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.incomingRequests = action.payload;
      })
      .addCase(fetchIncomingRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Fetch Outgoing Requests
      .addCase(fetchOutgoingRequests.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchOutgoingRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.outgoingRequests = action.payload;
      })
      .addCase(fetchOutgoingRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Send Request
      .addCase(sendFriendRequest.pending, (state) => {
        state.isActionLoading = true;
      })
      .addCase(sendFriendRequest.fulfilled, (state) => {
        state.isActionLoading = false;
        state.isSuccess = true;
      })
      .addCase(sendFriendRequest.rejected, (state, action) => {
        state.isActionLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Respond to Request (Accept / Reject)
      .addCase(respondToFriendRequest.pending, (state) => {
        state.isActionLoading = true;
      })
      .addCase(respondToFriendRequest.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.isSuccess = true;
        const { friendshipId, action: responseAction } = action.payload;

        const targetRequest = state.incomingRequests.find(
          (req) => req._id === friendshipId
        );

        // Remove from incoming queue
        state.incomingRequests = state.incomingRequests.filter(
          (req) => req._id !== friendshipId
        );

        // If accepted, add the user to local friends state
        if (responseAction === "accept" && targetRequest) {
          state.friends.push({
            friendshipId: targetRequest._id,
            friend: targetRequest.requester,
            since: new Date().toISOString(),
          });
        }
      })
      .addCase(respondToFriendRequest.rejected, (state, action) => {
        state.isActionLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Delete Friendship / Cancel Request
      .addCase(deleteFriendship.pending, (state) => {
        state.isActionLoading = true;
      })
      .addCase(deleteFriendship.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.isSuccess = true;
        const { friendshipId } = action.payload;

        state.friends = state.friends.filter(
          (f) => f.friendshipId !== friendshipId
        );
        state.incomingRequests = state.incomingRequests.filter(
          (req) => req._id !== friendshipId
        );
        state.outgoingRequests = state.outgoingRequests.filter(
          (req) => req._id !== friendshipId
        );
      })
      .addCase(deleteFriendship.rejected, (state, action) => {
        state.isActionLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetFriendStatus } = friendSlice.actions;

export default friendSlice.reducer;