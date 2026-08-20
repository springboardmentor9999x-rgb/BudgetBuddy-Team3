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

function AnalyticsDashboard() {
  const [spendingData, setSpendingData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [savingsData, setSavingsData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      const [
        spending,
        monthly,
        savings,
        summaryData,
      ] = await Promise.all([
        getSpendingByCategory(),
        getMonthlyTrend(),
        getSavingsProgress(),
        getAnalyticsSummary(),
      ]);

      setSpendingData(spending);
      setMonthlyData(monthly);
      setSavingsData(savings);
      setSummary(summaryData);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePDFDownload = async () => {
    try {
      await downloadMonthlyPDF(currentMonth, currentYear);
    } catch (error) {
      console.error("PDF download failed:", error);
    }
  };

  const handleExcelDownload = async () => {
    try {
      await downloadMonthlyExcel(currentMonth, currentYear);
    } catch (error) {
      console.error("Excel download failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <h3>Loading your analytics...</h3>
        <p>Preparing your financial insights</p>
      </div>
    );
  }

  const savingsRate = Number(summary?.savings_rate || 0);

  let healthText = "Needs attention";
  let healthClass = "warning";

  if (savingsRate >= 50) {
    healthText = "Excellent";
    healthClass = "excellent";
  } else if (savingsRate >= 30) {
    healthText = "Healthy";
    healthClass = "healthy";
  } else if (savingsRate >= 15) {
    healthText = "Moderate";
    healthClass = "moderate";
  }

  return (
    <div className="analytics-page">

      {/* ================= HEADER ================= */}

      <div className="analytics-topbar">

        <div>
          <div className="analytics-breadcrumb">
            Dashboard <span>/</span> Analytics
          </div>

          <h1>Financial Analytics</h1>

          <p>
            Understand your spending, income and savings performance.
          </p>
        </div>

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


      {/* ================= HEALTH BANNER ================= */}

      <div className={`financial-health ${healthClass}`}>

        <div className="health-icon">
          {healthClass === "excellent" ? "✓" : "!"}
        </div>

        <div className="health-content">
          <span>Financial Health</span>
          <strong>{healthText}</strong>
          <p>
            You're currently saving{" "}
            <b>{savingsRate}%</b> of your income.
          </p>
        </div>

        <div className="health-progress">
          <div
            className="health-progress-fill"
            style={{
              width: `${Math.min(savingsRate, 100)}%`,
            }}
          ></div>
        </div>

      </div>


      {/* ================= SUMMARY CARDS ================= */}

      <div className="analytics-section-title">
        <div>
          <h2>Financial Overview</h2>
          <p>Your overall financial performance</p>
        </div>

        <span className="period-badge">
          {currentYear}
        </span>
      </div>


      <div className="summary-grid">

        {/* Income */}

        <div className="summary-card income-card">

          <div className="summary-card-top">
            <div className="summary-icon income-icon">
              ₹
            </div>

            <span className="summary-label">
              Total Income
            </span>
          </div>

          <div className="summary-value">
            ₹{Number(summary?.total_income || 0).toLocaleString("en-IN")}
          </div>

          <div className="summary-bottom">
            <span className="positive">↑ Income</span>
            <span>This period</span>
          </div>

        </div>


        {/* Expenses */}

        <div className="summary-card expense-card">

          <div className="summary-card-top">
            <div className="summary-icon expense-icon">
              −
            </div>

            <span className="summary-label">
              Total Expenses
            </span>
          </div>

          <div className="summary-value">
            ₹{Number(summary?.total_expenses || 0).toLocaleString("en-IN")}
          </div>

          <div className="summary-bottom">
            <span className="negative">↓ Spending</span>
            <span>This period</span>
          </div>

        </div>


        {/* Balance */}

        <div className="summary-card balance-card">

          <div className="summary-card-top">
            <div className="summary-icon balance-icon">
              ✓
            </div>

            <span className="summary-label">
              Net Balance
            </span>
          </div>

          <div className="summary-value">
            ₹{Number(summary?.net_balance || 0).toLocaleString("en-IN")}
          </div>

          <div className="summary-bottom">
            <span className="positive">Available</span>
            <span>After expenses</span>
          </div>

        </div>


        {/* Savings */}

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

            <span>Of income</span>
          </div>

        </div>

      </div>


      {/* ================= CHARTS ================= */}

      <div className="analytics-section-title charts-title">

        <div>
          <h2>Spending & Income Insights</h2>
          <p>Visualize where your money is going</p>
        </div>

      </div>


      <div className="charts-grid">

        {/* Spending */}

        <div className="chart-card spending-chart-card">

          <div className="chart-header">

            <div>
              <h3>Spending by Category</h3>
              <p>Where you spend your money</p>
            </div>

            <div className="chart-menu">
              •••
            </div>

          </div>

          <div className="chart-container pie-container">
            <SpendingPieChart
              data={spendingData}
            />
          </div>

        </div>


        {/* Monthly Trend */}

        <div className="chart-card trend-chart-card">

          <div className="chart-header">

            <div>
              <h3>Monthly Income & Expenses</h3>
              <p>Track your financial trend</p>
            </div>

            <div className="chart-menu">
              •••
            </div>

          </div>

          <div className="chart-container trend-container">
            <MonthlyTrendLineChart
              data={monthlyData}
            />
          </div>

        </div>

      </div>


      {/* ================= SAVINGS ================= */}

      <div className="analytics-section-title savings-title">

        <div>
          <h2>Savings Goals</h2>
          <p>Track your progress toward financial goals</p>
        </div>

      </div>


      <div className="savings-section">

        <div className="savings-header">

          <div>
            <span className="savings-small-title">
              Your active goals
            </span>

            <h3>
              Keep building your future
            </h3>
          </div>

          <div className="savings-target">
            🎯 {savingsData.length} Goals
          </div>

        </div>

        <SavingsProgressBar
          goals={savingsData}
        />

      </div>


      {/* ================= INSIGHT ================= */}

      <div className="insight-card">

        <div className="insight-icon">
          💡
        </div>

        <div>

          <h3>Smart Financial Insight</h3>

          <p>
            {savingsRate >= 30
              ? "Great job! Your savings rate is healthy. Keep maintaining this balance between spending and saving."
              : "Try reducing unnecessary expenses and setting aside a fixed amount every month to improve your savings rate."
            }
          </p>

        </div>

      </div>

    </div>
  );
}

export default AnalyticsDashboard;