// frontend/src/api/billing.js

import api from "./axios";


/* =========================================================
   START PREMIUM TRIAL

   Activates the 1-month free Premium trial for the current
   user. Returns the updated user record (role: "premium").
   ========================================================= */

export const startPremiumTrial = async () => {

  const response = await api.post(
    "/auth/start-trial"
  );

  return response.data;

};


/* =========================================================
   REQUEST PREMIUM ACCESS

   Sends a Premium access request to the Admin.

   The Basic User does NOT become Premium immediately.
   The Admin receives an in-app notification and can then
   upgrade the user through User Management.

   Returns:
   {
     message: "...",
     request_id: ...
   }
   ========================================================= */

export const requestPremium = async () => {

  const response = await api.post(
    "/auth/request-premium"
  );

  return response.data;

};


/* =========================================================
   CANCEL PREMIUM TRIAL

   Schedules cancellation for the end of the current Premium
   period. This does NOT revoke access right away — the user
   keeps Premium until premium_expires_at, and can undo this
   with reactivatePremiumTrial() until then.
   Returns the updated user record.
   ========================================================= */

export const cancelPremiumTrial = async () => {

  const response = await api.post(
    "/auth/cancel-premium"
  );

  return response.data;

};


/* =========================================================
   REACTIVATE PREMIUM TRIAL

   Undoes a scheduled cancellation. Does NOT start a new
   trial, change the expiry date, or charge the user.
   Returns the updated user record.
   ========================================================= */

export const reactivatePremiumTrial = async () => {

  const response = await api.post(
    "/auth/reactivate-premium"
  );

  return response.data;

};