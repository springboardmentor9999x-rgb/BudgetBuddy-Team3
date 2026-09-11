import api from "./axios";

// ==========================================================
// GET CURRENT USER'S NOTIFICATIONS
// ==========================================================
// Optional AbortSignal is supported so that an old user's
// request can be cancelled when switching accounts.
// ==========================================================

export const getNotifications = async (signal = null) => {
  const response = await api.get("/notifications/", {
    signal,
  });

  return response.data;
};


// ==========================================================
// MARK NOTIFICATION AS READ
// ==========================================================

export const markNotificationAsRead = async (id) => {
  const response = await api.patch(
    `/notifications/${id}/read`
  );

  return response.data;
};