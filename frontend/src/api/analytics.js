import api from "./axios";


/* =========================================================
   HELPER — BUILD QUERY PARAMS
========================================================= */

/*
  Removes undefined, null and empty-string values.

  This prevents requests such as:

    ?month=undefined
    ?year=undefined
    ?start_date=

  from being sent to the backend.
*/

const cleanParams = (params = {}) => {

  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
  );

};


/* =========================================================
   SPENDING BY CATEGORY
========================================================= */

/*
  BASIC USER
    Backend should restrict this to the current month.

  PREMIUM / ADMIN
    Can request a specific month and year.
*/

export const getSpendingByCategory = async (
  month,
  year
) => {

  const params = cleanParams({
    month,
    year,
  });


  const response =
    await api.get(
      "/analytics/spending-by-category",
      {
        params,
      }
    );


  return response.data;

};


/* =========================================================
   DAILY TREND
========================================================= */

/*
  Returns daily income and expense data.

  Example:

    getDailyTrend({
      month: 8,
      year: 2026
    });

  Backend:

    /analytics/monthly-trend
    ?months=1
    &month=8
    &year=2026
    &granularity=day
*/

export const getDailyTrend = async ({
  month,
  year,
} = {}) => {

  const params = cleanParams({
    months: 1,
    month,
    year,
    granularity: "day",
  });


  const response =
    await api.get(
      "/analytics/monthly-trend",
      {
        params,
      }
    );


  return response.data;

};


/* =========================================================
   MONTHLY / DAILY TREND
========================================================= */

/*
  PREMIUM / ADMIN

  Supports:

    Current month daily
    Last 6 months
    Last 12 months
    Custom date range

  Supported examples:

    getMonthlyTrend({
      mode: "daily",
      month: 8,
      year: 2026,
    });

    getMonthlyTrend({
      mode: "monthly",
      months: 6,
      month: 8,
      year: 2026,
    });

    getMonthlyTrend({
      mode: "daily",
      start_date: "2026-07-01",
      end_date: "2026-08-31",
    });
*/

export const getMonthlyTrend = async ({
  months = 6,
  month,
  year,
  granularity = "month",
  mode,

  /*
    Custom date range support.
  */
  start_date,
  end_date,

  /*
    Also accept camelCase so the API remains
    convenient for other frontend code.
  */
  startDate,
  endDate,

} = {}) => {


  /* =======================================================
     RESOLVE GRANULARITY
  ======================================================= */

  let resolvedGranularity =
    granularity;


  if (
    mode === "daily" ||
    mode === "day"
  ) {

    resolvedGranularity = "day";

  }


  if (
    mode === "monthly" ||
    mode === "month"
  ) {

    resolvedGranularity = "month";

  }


  /* =======================================================
     RESOLVE CUSTOM DATES
  ======================================================= */

  const resolvedStartDate =
    start_date ||
    startDate ||
    "";

  const resolvedEndDate =
    end_date ||
    endDate ||
    "";


  /* =======================================================
     BUILD REQUEST
  ======================================================= */

  const params = cleanParams({

    /*
      For normal monthly/daily requests.
    */
    months,
    month,
    year,

    /*
      Backend expects:
        granularity=day
        granularity=month
    */
    granularity:
      resolvedGranularity,

    /*
      Custom date range.
    */
    start_date:
      resolvedStartDate,

    end_date:
      resolvedEndDate,

  });


  const response =
    await api.get(
      "/analytics/monthly-trend",
      {
        params,
      }
    );


  return response.data;

};


/* =========================================================
   CUSTOM DATE RANGE TREND
========================================================= */

/*
  PREMIUM / ADMIN ONLY

  Example:

    getCustomDateRangeTrend({
      startDate: "2026-07-01",
      endDate: "2026-08-15"
    });

  Backend:

    /analytics/monthly-trend
    ?start_date=2026-07-01
    &end_date=2026-08-15
    &granularity=day
*/

export const getCustomDateRangeTrend = async ({
  startDate,
  endDate,
} = {}) => {

  const params = cleanParams({

    start_date:
      startDate,

    end_date:
      endDate,

    granularity:
      "day",

  });


  const response =
    await api.get(
      "/analytics/monthly-trend",
      {
        params,
      }
    );


  return response.data;

};


/* =========================================================
   SAVINGS PROGRESS
========================================================= */

/*
  BASIC USER
    Current month.

  PREMIUM / ADMIN
    Can request selected month/year.
*/

export const getSavingsProgress = async (
  month,
  year
) => {

  const params = cleanParams({
    month,
    year,
  });


  const response =
    await api.get(
      "/analytics/savings-progress",
      {
        params,
      }
    );


  return response.data;

};


/* =========================================================
   ANALYTICS SUMMARY
========================================================= */

/*
  Returns:

    total_income
    total_expenses
    net_balance
    savings_rate
    account_balance

  BASIC:
    Current month.

  PREMIUM / ADMIN:
    Selected month.
*/

export const getAnalyticsSummary = async (
  month,
  year
) => {

  const params = cleanParams({
    month,
    year,
  });


  const response =
    await api.get(
      "/analytics/summary",
      {
        params,
      }
    );


  return response.data;

};


/* =========================================================
   ACCOUNT BALANCE
========================================================= */

/*
  Returns:

    {
      account_balance: number
    }
*/

export const getMonthlyAccountBalance = async (
  month,
  year
) => {

  const params = cleanParams({
    month,
    year,
  });


  const response =
    await api.get(
      "/analytics/account-balance",
      {
        params,
      }
    );


  return response.data;

};


/* =========================================================
   DEFAULT EXPORT
========================================================= */

const analyticsApi = {

  getSpendingByCategory,

  getDailyTrend,

  getMonthlyTrend,

  getCustomDateRangeTrend,

  getSavingsProgress,

  getAnalyticsSummary,

  getMonthlyAccountBalance,

};


export default analyticsApi;