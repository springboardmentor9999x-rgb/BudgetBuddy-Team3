import api from "./axios";

/* =========================================================
   SPENDING BY CATEGORY
========================================================= */

export const getSpendingByCategory = async (
  month = null,
  year = null
) => {
  const params = {};

  if (month !== null && month !== undefined) {
    params.month = month;
  }

  if (year !== null && year !== undefined) {
    params.year = year;
  }

  const response = await api.get(
    "/analytics/spending-by-category",
    {
      params,
    }
  );

  return response.data;
};


/* =========================================================
   MONTHLY TREND
========================================================= */

export const getMonthlyTrend = async (
  months = 6
) => {
  const response = await api.get(
    "/analytics/monthly-trend",
    {
      params: {
        months,
      },
    }
  );

  return response.data;
};


/* =========================================================
   SAVINGS PROGRESS
========================================================= */

export const getSavingsProgress = async () => {
  const response = await api.get(
    "/analytics/savings-progress"
  );

  return response.data;
};


/* =========================================================
   ANALYTICS SUMMARY
========================================================= */

export const getAnalyticsSummary = async (
  month = null,
  year = null
) => {
  const params = {};

  if (month !== null && month !== undefined) {
    params.month = month;
  }

  if (year !== null && year !== undefined) {
    params.year = year;
  }

  const response = await api.get(
    "/analytics/summary",
    {
      params,
    }
  );

  return response.data;
};