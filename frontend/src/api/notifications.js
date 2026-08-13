import api from "./axios";

// Get current user's notifications
export const getNotifications = async () => {
  const response = await api.get("/notifications/");
  return response.data;
};

// Mark notification as read
export const markNotificationAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};