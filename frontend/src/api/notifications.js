import api from "./axios";

// ==========================================================
// GET CURRENT USER'S NOTIFICATIONS
// ==========================================================

export const getNotifications = async () => {
  const response = await api.get(
    "/notifications/"
  );

  return response.data;
};


// ==========================================================
// MARK NOTIFICATION AS READ
// ==========================================================

export const markNotificationAsRead = async (
  id
) => {
  const response = await api.patch(
    `/notifications/${id}/read`
  );

  return response.data;
};