import api from "./axios";

// ================================
// SAVINGS GOALS API
// ================================

// Get all savings goals
export const getSavingsGoals = async () => {
  const response = await api.get("/goals/");
  return response.data;
};

// Get one savings goal
export const getSavingsGoal = async (id) => {
  const response = await api.get(`/goals/${id}`);
  return response.data;
};

// Create savings goal
export const addSavingsGoal = async (goalData) => {
  const response = await api.post("/goals/", goalData);
  return response.data;
};

// Update savings goal
export const updateSavingsGoal = async (id, goalData) => {
  const response = await api.put(
    `/goals/${id}`,
    goalData
  );
  return response.data;
};

// Delete savings goal
export const deleteSavingsGoal = async (id) => {
  const response = await api.delete(`/goals/${id}`);
  return response.data;
};

// Contribute to savings goal
export const contributeToSavingsGoal = async (id, amount) => {
  const response = await api.patch(
    `/goals/${id}/contribute`,
    {
      amount: amount,
    }
  );
  return response.data;
};