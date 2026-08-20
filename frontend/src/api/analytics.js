import api from "./axios";

export const getSpendingByCategory = async () => {
  const response = await api.get("/analytics/spending-by-category");
  return response.data;
};

export const getMonthlyTrend = async () => {
  const response = await api.get("/analytics/monthly-trend");
  return response.data;
};

export const getSavingsProgress = async () => {
  const response = await api.get("/analytics/savings-progress");
  return response.data;
};

export const getAnalyticsSummary = async () => {
  const response = await api.get("/analytics/summary");
  return response.data;
};