import api from "./axios";

// ================================
// EXPENSE API
// ================================

export const getExpenses = async () => {
  const response = await api.get("/expenses/");
  return response.data;
};

export const getExpense = async (id) => {
  const response = await api.get(`/expenses/${id}`);
  return response.data;
};

export const addExpense = async (expenseData) => {
  const response = await api.post("/expenses/", expenseData);
  return response.data;
};

export const updateExpense = async (id, expenseData) => {
  const response = await api.put(
    `/expenses/${id}`,
    expenseData
  );
  return response.data;
};

export const deleteExpense = async (id) => {
  const response = await api.delete(`/expenses/${id}`);
  return response.data;
};