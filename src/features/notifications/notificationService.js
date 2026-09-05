import httpClient from "../../plugins/interceptor";

const API_URL = "notifications";

const getNotifications = async () => {
  const response = await httpClient.get(API_URL);
  return response.data; // { notifications: [...], unreadCount: number }
};

const markAllAsRead = async () => {
  const response = await httpClient.patch(API_URL);
  return response.data;
};

const markSingleAsRead = async (notificationId) => {
  const response = await httpClient.patch(`${API_URL}/${notificationId}`);
  return response.data;
};

const notificationService = {
  getNotifications,
  markAllAsRead,
  markSingleAsRead,
};

export default notificationService;