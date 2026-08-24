import api from "./axios";

// ==========================================
// GET ALL SAVINGS GOALS
// ==========================================

export const getSavingsGoals = async () => {
  const response = await api.get("/goals/");
  return response.data;
};


// ==========================================
// GET SINGLE SAVINGS GOAL
// ==========================================

export const getSavingsGoal = async (id) => {
  const response = await api.get(`/goals/${id}`);
  return response.data;
};


// ==========================================
// CREATE SAVINGS GOAL
// ==========================================

export const addSavingsGoal = async (goalData) => {
  const response = await api.post(
    "/goals/",
    goalData
  );

  return response.data;
};


// ==========================================
// UPDATE SAVINGS GOAL
// ==========================================

export const updateSavingsGoal = async (
  id,
  goalData
) => {
  const response = await api.put(
    `/goals/${id}`,
    goalData
  );

  return response.data;
};


// ==========================================
// DELETE SAVINGS GOAL
// ==========================================

export const deleteSavingsGoal = async (id) => {
  const response = await api.delete(
    `/goals/${id}`
  );

  return response.data;
};


// ==========================================
// CONTRIBUTE TO SAVINGS GOAL
// ==========================================
//
// IMPORTANT:
// The backend already knows which bank account
// belongs to the goal through:
//
// goal.bank_account_id
//
// Therefore only amount is sent.
//

export const contributeToSavingsGoal = async (
  id,
  amount
) => {

  const response = await api.patch(
    `/goals/${id}/contribute`,
    {
      amount: amount
    }
  );

  return response.data;
};