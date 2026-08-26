import { useEffect, useState } from "react";

import {
  getSpendingByCategory,
  getMonthlyTrend,
  getSavingsProgress,
  getAnalyticsSummary,
} from "../api/analytics";

import {
  downloadMonthlyPDF,
  downloadMonthlyExcel,
} from "../api/reports";

import SpendingPieChart from "../components/SpendingPieChart";
import MonthlyTrendLineChart from "../components/MonthlyTrendLineChart";
import SavingsProgressBar from "../components/SavingsProgressBar";

import "./AnalyticsDashboard.css";


/* =========================================================
   MONTH NAMES
========================================================= */

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];


function AnalyticsDashboard() {

  /* =======================================================
     CURRENT DATE
  ======================================================= */

  const currentDate = new Date();

  const currentMonth =
    currentDate.getMonth() + 1;

  const currentYear =
    currentDate.getFullYear();


  /* =======================================================
     SELECTED MONTH
  ======================================================= */

  const [selectedMonth, setSelectedMonth] =
    useState(currentMonth);

  const [selectedYear, setSelectedYear] =
    useState(currentYear);


  /* =======================================================
     ANALYTICS DATA
  ======================================================= */

  const [spendingData, setSpendingData] =
    useState([]);

  const [monthlyData, setMonthlyData] =
    useState([]);

  const [savingsData, setSavingsData] =
    useState([]);

  const [summary, setSummary] =
    useState(null);


  /* =======================================================
     UI STATE
  ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /* =======================================================
     MONTH LABEL
  ======================================================= */

  const selectedMonthName =
    MONTH_NAMES[selectedMonth - 1];


  /* =======================================================
     LOAD ANALYTICS
  ======================================================= */

  const loadAnalytics = async (
    month = selectedMonth,
    year = selectedYear
  ) => {

    try {

      setLoading(true);
      setError("");

      const [
        spending,
        monthly,
        savings,
        summaryData,
      ] = await Promise.all([

        getSpendingByCategory(
          month,
          year
        ),

        getMonthlyTrend(6),

        getSavingsProgress(
          month,
          year
        ),

        getAnalyticsSummary(
          month,
          year
        ),

      ]);

      setSpendingData(
        spending || []
      );

      setMonthlyData(
        monthly || []
      );

      setSavingsData(
        savings || []
      );

      setSummary(
        summaryData || null
      );

    } catch (error) {

      console.error(
        "Failed to load analytics:",
        error
      );

      setSpendingData([]);
      setMonthlyData([]);
      setSavingsData([]);
      setSummary(null);

      setError(
        "Unable to load analytics for the selected month."
      );

    } finally {

      setLoading(false);

    }
  };


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {

    loadAnalytics(
      currentMonth,
      currentYear
    );

  }, []);


  /* =======================================================
     HANDLE MONTH CHANGE
  ======================================================= */

  const handleMonthChange = (
    event
  ) => {

    const value =
      event.target.value;

    if (!value) {
      return;
    }

    const [
      year,
      month,
    ] = value
      .split("-")
      .map(Number);

    setSelectedMonth(month);
    setSelectedYear(year);

    loadAnalytics(
      month,
      year
    );
  };


  /* =======================================================
     GENERATE MONTH OPTIONS
========================================================= */

  const generateMonthOptions = () => {

    const options = [];

    const startDate =
      new Date(
        currentYear,
        currentMonth - 1,
        1
      );

    /*
     * Show current month + previous 11 months.
     *
     * Example:
     *
     * August 2026
     * July 2026
     * June 2026
     * ...
     * September 2025
     */

    for (
      let i = 0;
      i < 12;
      i++
    ) {

      const date =
        new Date(
          startDate.getFullYear(),
          startDate.getMonth() - i,
          1
        );

      const year =
        date.getFullYear();

      const month =
        date.getMonth() + 1;

      const value =
        `${year}-${String(month).padStart(2, "0")}`;

      const label =
        `${MONTH_NAMES[month - 1]} ${year}`;

      options.push({
        value,
        label,
      });
    }

    return options;
  };


  /* =======================================================
     DOWNLOAD PDF
  ======================================================= */

  const handlePDFDownload =
    async () => {

      try {

        await downloadMonthlyPDF(
          selectedMonth,
          selectedYear
        );

      } catch (error) {

        console.error(
          "PDF download failed:",
          error
        );

      }
    };


  /* =======================================================
     DOWNLOAD EXCEL
  ======================================================= */

  const handleExcelDownload =
    async () => {

      try {

        await downloadMonthlyExcel(
          selectedMonth,
          selectedYear
        );

      } catch (error) {

        console.error(
          "Excel download failed:",
          error
        );

      }
    };


  /* =======================================================
     FINANCIAL HEALTH
  ======================================================= */

  const savingsRate =
    Number(
      summary?.savings_rate || 0
    );


  let healthText =
    "Needs attention";

  let healthClass =
    "warning";


  if (savingsRate >= 50) {

    healthText =
      "Excellent";

    healthClass =
      "excellent";

  } else if (savingsRate >= 30) {

    healthText =
      "Healthy";

    healthClass =
      "healthy";

  } else if (savingsRate >= 15) {

    healthText =
      "Moderate";

    healthClass =
      "moderate";
  }


  /* =======================================================
     GOALS
  ======================================================= */

  const totalGoals =
    savingsData.length;


  const completedGoals =
    savingsData.filter(
      (goal) =>
        Number(
          goal.percentage || 0
        ) >= 100
    ).length;


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {

    return (
      <div className="analytics-loading">

        <div className="loading-spinner"></div>

        <h3>
          Loading your analytics...
        </h3>

        <p>
          Preparing your financial insights
        </p>

      </div>
    );
  }


  /* =======================================================
     MAIN UI
  ======================================================= */

  return (

    <div className="analytics-page">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="analytics-topbar">

        <div>

          <div className="analytics-breadcrumb">

            Dashboard

            <span>/</span>

            Analytics

          </div>


          <div className="analytics-heading-row">

            <div>

              <h1>
                Financial Analytics
              </h1>

              <p>
                A clear view of your financial
                performance, spending and savings.
              </p>

            </div>


            <div className="analytics-live-status">

              <span></span>

              Live data

            </div>

          </div>

        </div>


        {/* EXPORT BUTTONS */}

        <div className="analytics-actions">

          <button
            className="export-btn pdf-btn"
            onClick={handlePDFDownload}
          >

            <span>↓</span>

            Export PDF

          </button>


          <button
            className="export-btn excel-btn"
            onClick={handleExcelDownload}
          >

            <span>↓</span>

            Export Excel

          </button>

        </div>

      </div>


      {/* ===================================================
          ANALYTICS PERIOD SELECTOR
      =================================================== */}

      <div className="analytics-period-card">

        <div>

          <span className="period-eyebrow">
            ANALYTICS PERIOD
          </span>

          <h3>
            Selected month
          </h3>

          <p>
            Choose a month to view your income,
            expenses and spending breakdown.
          </p>

        </div>


        <div className="period-selector-wrapper">

          <div className="period-selector-icon">
            📅
          </div>

          <select
            className="period-selector"
            value={`${selectedYear}-${String(
              selectedMonth
            ).padStart(2, "0")}`}
            onChange={handleMonthChange}
          >

            {generateMonthOptions().map(
              (option) => (

                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>

              )
            )}

          </select>

          <span className="period-selector-arrow">
            ▼
          </span>

        </div>

      </div>


      {/* ===================================================
          ERROR MESSAGE
      =================================================== */}

      {error && (

        <div className="analytics-error">

          <div className="analytics-error-icon">
            !
          </div>

          <span>
            {error}
          </span>

        </div>

      )}


      {/* ===================================================
          FINANCIAL HEALTH
      =================================================== */}

      <div
        className={`financial-health ${healthClass}`}
      >

        <div className="health-icon">

          {healthClass === "excellent"
            ? "✓"
            : healthClass === "healthy"
            ? "↗"
            : "!"}

        </div>


        <div className="health-content">

          <span>
            Financial Health
          </span>

          <strong>
            {healthText}
          </strong>

          <p>
            You're currently saving{" "}
            <b>
              {savingsRate}%
            </b>{" "}
            of your income.
          </p>

        </div>


        <div className="health-progress-wrapper">

          <div className="health-progress-label">

            <span>
              Saving performance
            </span>

            <strong>
              {savingsRate}%
            </strong>

          </div>


          <div className="health-progress">

            <div
              className="health-progress-fill"
              style={{
                width: `${Math.min(
                  Math.max(
                    savingsRate,
                    0
                  ),
                  100
                )}%`,
              }}
            ></div>

          </div>

        </div>

      </div>


      {/* ===================================================
          OVERVIEW
      =================================================== */}

      <div className="analytics-section-title">

        <div>

          <div className="section-eyebrow">
            OVERVIEW
          </div>

          <h2>
            Financial Overview
          </h2>

          <p>
            Your financial performance for{" "}
            {selectedMonthName}{" "}
            {selectedYear}
          </p>

        </div>


        <span className="period-badge">

          {selectedMonthName}{" "}
          {selectedYear}

        </span>

      </div>


      {/* ===================================================
          SUMMARY CARDS
      =================================================== */}

      <div className="summary-grid">

        {/* INCOME */}

        <div className="summary-card income-card">

          <div className="summary-card-top">

            <div className="summary-icon income-icon">
              ↗
            </div>

            <span className="summary-label">
              Total Income
            </span>

          </div>


          <div className="summary-value">

            ₹
            {Number(
              summary?.total_income || 0
            ).toLocaleString("en-IN")}

          </div>


          <div className="summary-bottom">

            <span className="positive">
              ↑ Income
            </span>

            <span>
              {selectedMonthName}
            </span>

          </div>

        </div>


        {/* EXPENSES */}

        <div className="summary-card expense-card">

          <div className="summary-card-top">

            <div className="summary-icon expense-icon">
              ↘
            </div>

            <span className="summary-label">
              Total Expenses
            </span>

          </div>


          <div className="summary-value">

            ₹
            {Number(
              summary?.total_expenses || 0
            ).toLocaleString("en-IN")}

          </div>


          <div className="summary-bottom">

            <span className="negative">
              ↓ Spending
            </span>

            <span>
              {selectedMonthName}
            </span>

          </div>

        </div>


        {/* BALANCE */}

        <div className="summary-card balance-card">

          <div className="summary-card-top">

            <div className="summary-icon balance-icon">
              =
            </div>

            <span className="summary-label">
              Net Balance
            </span>

          </div>


          <div className="summary-value">

            ₹
            {Number(
              summary?.net_balance || 0
            ).toLocaleString("en-IN")}

          </div>


          <div className="summary-bottom">

            <span className="positive">
              Available
            </span>

            <span>
              After expenses
            </span>

          </div>

        </div>


        {/* SAVINGS */}

        <div className="summary-card savings-card">

          <div className="summary-card-top">

            <div className="summary-icon savings-icon">
              %
            </div>

            <span className="summary-label">
              Savings Rate
            </span>

          </div>


          <div className="summary-value">

            {savingsRate}%

          </div>


          <div className="summary-bottom">

            <span className="positive">
              {healthText}
            </span>

            <span>
              Of income
            </span>

          </div>

        </div>

      </div>


      {/* ===================================================
          CHARTS
      =================================================== */}

      <div className="analytics-section-title charts-title">

        <div>

          <div className="section-eyebrow">
            ANALYTICS
          </div>

          <h2>
            Spending & Income Insights
          </h2>

          <p>
            Understand how your money moves over time
          </p>

        </div>

      </div>


      <div className="charts-grid">

        {/* SPENDING */}

        <div className="chart-card spending-chart-card">

          <div className="chart-header">

            <div>

              <span className="chart-eyebrow">
                BREAKDOWN
              </span>

              <h3>
                Spending by Category
              </h3>

              <p>
                {spendingData.length > 0
                  ? `Spending breakdown for ${selectedMonthName} ${selectedYear}`
                  : `No expenses recorded for ${selectedMonthName} ${selectedYear}`}
              </p>

            </div>


            <div className="chart-badge">

              {spendingData.length}{" "}

              {spendingData.length === 1
                ? "category"
                : "categories"}

            </div>

          </div>


          <div className="chart-container pie-container">

            <SpendingPieChart
              data={spendingData}
            />

          </div>

        </div>


        {/* MONTHLY TREND */}

        <div className="chart-card trend-chart-card">

          <div className="chart-header">

            <div>

              <span className="chart-eyebrow">
                TREND
              </span>

              <h3>
                Monthly Income & Expenses
              </h3>

              <p>
                Track your financial performance
              </p>

            </div>


            <div className="chart-badge">
              Last 6 months
            </div>

          </div>


          <div className="chart-container trend-container">

            <MonthlyTrendLineChart
              data={monthlyData}
            />

          </div>

        </div>

      </div>


      {/* ===================================================
          SAVINGS GOALS
      =================================================== */}

      <div className="analytics-section-title savings-title">

        <div>

          <div className="section-eyebrow">
            GOALS
          </div>

          <h2>
            Savings Goals
          </h2>

          <p>
            Track your progress toward financial goals
          </p>

        </div>


        <div className="goal-summary-badge">

          <strong>
            {completedGoals}
          </strong>

          <span>
            of {totalGoals} completed
          </span>

        </div>

      </div>


      <div className="savings-section">

        <div className="savings-header">

          <div>

            <span className="savings-small-title">
              YOUR FINANCIAL TARGETS
            </span>

            <h3>
              Keep building your future
            </h3>

          </div>


          <div className="savings-target">

            🎯 {totalGoals}{" "}

            {totalGoals === 1
              ? "Goal"
              : "Goals"}

          </div>

        </div>


        <SavingsProgressBar
          goals={savingsData}
        />

      </div>


      {/* ===================================================
          INSIGHT
      =================================================== */}

      <div className="insight-card">

        <div className="insight-icon">
          💡
        </div>


        <div className="insight-content">

          <span className="insight-label">
            PERSONALIZED INSIGHT
          </span>

          <h3>
            Smart Financial Insight
          </h3>


          <p>

            {savingsRate >= 50

              ? "Excellent work. You're saving more than half of your income. Keep maintaining this strong financial discipline."

              : savingsRate >= 30

              ? "Great job! Your savings rate is healthy. Keep maintaining a good balance between spending and saving."

              : savingsRate >= 15

              ? "You're making progress. Try identifying one or two unnecessary spending categories and redirect that money toward your savings goals."

              : "Your savings rate could improve. Consider reducing non-essential expenses and setting aside a fixed amount whenever you receive income."

            }

          </p>

        </div>

      </div>

    </div>
  );
}


export default AnalyticsDashboard;