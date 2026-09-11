const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";


// ==========================================================
// GET AUTH TOKEN
//
// Use sessionStorage so each browser tab has its own
// authenticated account/session.
// ==========================================================

const getToken = () =>
  sessionStorage.getItem("token");


// ==========================================================
// GENERIC ADMIN REQUEST
// ==========================================================

const request = async (
  url,
  options = {}
) => {

  const token = getToken();

  const response = await fetch(
    `${API_BASE_URL}${url}`,
    {
      ...options,

      headers: {
        "Content-Type": "application/json",

        ...(token
          ? {
              Authorization:
                `Bearer ${token}`,
            }
          : {}),

        ...(options.headers || {}),
      },
    }
  );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {

    throw new Error(
      data.detail ||
      data.message ||
      "Request failed"
    );

  }

  return data;
};


// ==========================================================
// GET ADMIN USERS
// ==========================================================

export const getAdminUsers = async (
  search = ""
) => {

  const query = search
    ? `?search=${encodeURIComponent(search)}`
    : "";

  return request(
    `/admin/users${query}`
  );
};


// ==========================================================
// GET SINGLE ADMIN USER
// ==========================================================

export const getAdminUser = async (
  userId
) => {

  return request(
    `/admin/users/${userId}`
  );
};


// ==========================================================
// UPDATE USER ROLE
// ==========================================================

export const updateUserRole = async (
  userId,
  role
) => {

  return request(
    `/admin/users/${userId}/role`,
    {
      method: "PATCH",

      body: JSON.stringify({
        role,
      }),
    }
  );
};


// ==========================================================
// SYSTEM ANALYTICS
// ==========================================================

export const getSystemAnalytics = async () => {

  return request(
    "/admin/system-analytics"
  );
};


// ==========================================================
// APPROVE PREMIUM REQUEST
// ==========================================================

export const approvePremiumRequest = async (
  userId
) => {

  return request(
    `/admin/users/${userId}/premium-request/approve`,
    {
      method: "POST",
    }
  );
};


// ==========================================================
// REJECT PREMIUM REQUEST
// ==========================================================

export const rejectPremiumRequest = async (
  userId
) => {

  return request(
    `/admin/users/${userId}/premium-request/reject`,
    {
      method: "POST",
    }
  );
};