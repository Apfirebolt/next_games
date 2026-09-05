import httpClient from "../../plugins/interceptor";

const API_URL = "friends";

// Fetch friends or requests (type: "accepted" | "incoming" | "outgoing")
const getFriends = async (type = "accepted") => {
  const response = await httpClient.get(`${API_URL}?type=${type}`);
  return response.data; // Expected: { friends: [...] } or { requests: [...] }
};

// Send a friend request
const sendFriendRequest = async (recipientId) => {
  const response = await httpClient.post(API_URL, { recipientId });
  return response.data; // Expected: { message: string, friendshipId: string }
};

// Respond to a friend request (action: "accept" | "reject")
const respondToRequest = async (friendshipId, action) => {
  const response = await httpClient.patch(`${API_URL}/${friendshipId}`, { action });
  return response.data; // Expected: { message: string, status: string }
};

// Remove a friend or cancel a sent request
const removeFriendship = async (friendshipId) => {
  const response = await httpClient.delete(`${API_URL}/${friendshipId}`);
  return response.data; // Expected: { message: string }
};

const friendService = {
  getFriends,
  sendFriendRequest,
  respondToRequest,
  removeFriendship,
};

export default friendService;