// frontend/src/api/axios.js

import axios from "axios";


const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,

  headers: {
    "Content-Type": "application/json",
  },
});


/* =========================================================
   REQUEST INTERCEPTOR

   Automatically attach JWT token to every request.
   ========================================================= */

api.interceptors.request.use(
  (config) => {

    const token =
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("access_token");


    if (token) {

      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }


    return config;
  },

  (error) => {

    return Promise.reject(
      error
    );
  }
);


/* =========================================================
   RESPONSE INTERCEPTOR

   If backend returns 401, don't crash the application.
   ========================================================= */

api.interceptors.response.use(
  (response) => {

    return response;
  },

  (error) => {

    if (
      error.response &&
      error.response.status === 401
    ) {

      console.warn(
        "Authentication required."
      );

      // Do not automatically remove the token here.
      // Your existing authentication flow can handle it.
    }


    return Promise.reject(error);
  }
);


export default api;