import httpClient from "../../plugins/interceptor";

const API_URL = "conversations";

// 1. Fetch user inbox conversations
const getConversations = async () => {
  const response = await httpClient.get(API_URL);
  return response.data; // Expected: { conversations: [...] }
};

// 2. Start or find a conversation with a friend
const startConversation = async (recipientId) => {
  const response = await httpClient.post(API_URL, { recipientId });
  return response.data; // Expected: { conversation: { ... } }
};

// 3. Fetch chronological messages for a conversation
const getMessages = async (conversationId) => {
  const response = await httpClient.get(`${API_URL}/${conversationId}/messages`);
  return response.data; // Expected: { messages: [...] }
};

// 4. Send a markdown message
const sendMessage = async (conversationId, content) => {
  const response = await httpClient.post(`${API_URL}/${conversationId}/messages`, {
    content,
  });
  return response.data; // Expected: { message: { ... } }
};

const conversationService = {
  getConversations,
  startConversation,
  getMessages,
  sendMessage,
};

export default conversationService;