import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Plus
} from "lucide-react";
import API, { onDataChanged } from "../services/api";
import { ExpenseCategoryChart, MonthlyComparisonChart } from "../components/ChartComponent";
import "./Dashboard.css";

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/dashboard/");
      setData(res.data);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.response?.data?.detail || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Re-fetch automatically when any transaction or goal is updated
    const unsubscribe = onDataChanged(() => {
      fetchDashboardData();
    });

    return () => unsubscribe();
  }, []);

  if (loading && !data) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your financial dashboard...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="dashboard-error glass-card">
        <AlertTriangle size={36} color="#ef4444" />
        <h2>Unable to load dashboard</h2>
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const summary = data?.summary || {
    total_balance: 0,
    total_income: 0,
    total_expenses: 0,
    savings: 0,
    savings_rate: 0,
  };

  const budget = data?.budget || {
    monthly_budget: 0,
    spent: 0,
    remaining: 0,
    usage_percentage: 0,
    is_overspent: false,
    is_warning: false,
    month_label: "This Month",
  };

  const categoryBreakdown = data?.category_breakdown || [];
  const monthlyTrends = data?.monthly_trends || [];
  const recentExpenses = data?.recent_expenses || [];
  const recentIncomes = data?.recent_incomes || [];
  const savingsGoals = data?.savings_goals || [];

  return (
    <div className="dashboard-page animate-fade-in">
      {/* Top Banner Greeting */}
      <div className="dashboard-hero-banner glass-card">
        <div className="hero-content">
          <h1>Welcome back! 👋</h1>
          <p>
            Here is your live student financial summary for <strong>{budget.month_label}</strong>.
          </p>
        </div>
        <div className="hero-actions">
          <Link to="/expenses" className="hero-btn expense">
            <Plus size={16} /> Add Expense
          </Link>
          <Link to="/income" className="hero-btn income">
            <Plus size={16} /> Add Income
          </Link>
        </div>
      </div>

      {/* 4 Major Financial Metric Cards */}
      <div className="metric-cards-grid">
        {/* Total Balance */}
        <div className="metric-card glass-card">
          <div className="metric-icon-box balance">
            <Wallet size={24} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Total Balance</span>
            <h2 className="metric-value">
              ₹{Number(summary.total_balance).toLocaleString("en-IN")}
            </h2>
            <span className="metric-subtext">Across all accounts</span>
          </div>
        </div>

        {/* Total Income */}
        <div className="metric-card glass-card">
          <div className="metric-icon-box income">
            <TrendingUp size={24} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Total Income</span>
            <h2 className="metric-value income-text">
              ₹{Number(summary.total_income).toLocaleString("en-IN")}
            </h2>
            <span className="metric-subtext">
              <ArrowUpRight size={14} color="#10b981" /> Inflow recorded
            </span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="metric-card glass-card">
          <div className="metric-icon-box expense">
            <TrendingDown size={24} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Total Expenses</span>
            <h2 className="metric-value expense-text">
              ₹{Number(summary.total_expenses).toLocaleString("en-IN")}
            </h2>
            <span className="metric-subtext">
              <ArrowDownRight size={14} color="#ef4444" /> Outflow recorded
            </span>
          </div>
        </div>

        {/* Net Savings */}
        <div className="metric-card glass-card">
          <div className="metric-icon-box savings">
            <PiggyBank size={24} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Net Savings</span>
            <h2
              className={`metric-value ${
                summary.savings >= 0 ? "savings-text" : "danger-text"
              }`}
            >
              ₹{Number(summary.savings).toLocaleString("en-IN")}
            </h2>
            <span className="metric-subtext">
              Savings Rate: <strong>{summary.savings_rate}%</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Budget Health Widget */}
      <div className="budget-health-card glass-card">
        <div className="budget-health-header">
          <div className="budget-title-area">
            <div className="icon-badge">📊</div>
            <div>
              <h3>Monthly Budget Status ({budget.month_label})</h3>
              <p>
                {budget.monthly_budget > 0
                  ? `Spent ₹${budget.spent.toLocaleString(
                      "en-IN"
                    )} of ₹${budget.monthly_budget.toLocaleString("en-IN")} limit`
                  : "No budget limit set for this month"}
              </p>
            </div>
          </div>

          <div className="budget-pct-tag">
            {budget.monthly_budget > 0 ? (
              <span
                className={`badge ${
                  budget.is_overspent
                    ? "badge-expense"
                    : budget.is_warning
                    ? "badge-warning"
                    : "badge-income"
                }`}
              >
                {budget.usage_percentage}% Used
              </span>
            ) : (
              <Link to="/budget" className="btn-primary" style={{ padding: "6px 14px" }}>
                Set Budget
              </Link>
            )}
          </div>
        </div>

        {budget.monthly_budget > 0 && (
          <>
            <div className="progress-bar-bg">
              <div
                className={`progress-bar-fill ${
                  budget.is_overspent
                    ? "danger"
                    : budget.is_warning
                    ? "warning"
                    : "normal"
                }`}
                style={{ width: `${Math.min(budget.usage_percentage, 100)}%` }}
              />
            </div>

            <div className="budget-health-footer">
              <span>
                Spent: <strong>₹{budget.spent.toLocaleString("en-IN")}</strong>
              </span>
              <span>
                Remaining:{" "}
                <strong
                  className={budget.remaining < 0 ? "danger-text" : "income-text"}
                >
                  ₹{budget.remaining.toLocaleString("en-IN")}
                </strong>
              </span>
            </div>
          </>
        )}
      </div>

      {/* Charts Section: Category Breakdown + Monthly Comparison */}
      <div className="charts-grid">
        {/* Category Breakdown Donut */}
        <div className="chart-card glass-card">
          <div className="card-header">
            <h3>Expense Breakdown by Category</h3>
            <Link to="/expenses" className="card-header-link">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="chart-body">
            <ExpenseCategoryChart categoryBreakdown={categoryBreakdown} />
          </div>
        </div>

        {/* Monthly Comparison Bar Chart */}
        <div className="chart-card glass-card">
          <div className="card-header">
            <h3>Income vs Expense Trends</h3>
            <Link to="/reports" className="card-header-link">
              Reports <ChevronRight size={14} />
            </Link>
          </div>
          <div className="chart-body">
            <MonthlyComparisonChart monthlyTrends={monthlyTrends} />
          </div>
        </div>
      </div>

      {/* Savings Goals & Recent Activity Grid */}
      <div className="dashboard-lower-grid">
        {/* Savings Goals Widget */}
        <div className="savings-widget glass-card">
          <div className="card-header">
            <div className="card-title-flex">
              <Target size={18} color="#8b5cf6" />
              <h3>Savings Goals</h3>
            </div>
            <Link to="/savings-goals" className="card-header-link">
              Manage <ChevronRight size={14} />
            </Link>
          </div>

          <div className="savings-goals-list">
            {savingsGoals.length === 0 ? (
              <div className="empty-widget">
                <p>No savings goals created yet.</p>
                <Link to="/savings-goals" className="btn-secondary" style={{ marginTop: "10px" }}>
                  + Create Your First Goal
                </Link>
              </div>
            ) : (
              savingsGoals.slice(0, 3).map((goal) => (
                <div key={goal.goal_id} className="goal-item-card">
                  <div className="goal-item-top">
                    <span className="goal-name">{goal.goal_name}</span>
                    <span className="goal-amounts">
                      ₹{goal.current_amount.toLocaleString("en-IN")} / ₹
                      {goal.target_amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="goal-bar-bg">
                    <div
                      className="goal-bar-fill"
                      style={{ width: `${goal.progress_percentage}%` }}
                    />
                  </div>
                  <div className="goal-item-bottom">
                    <span className="goal-pct">{goal.progress_percentage}% saved</span>
                    {goal.is_completed && (
                      <span className="badge badge-income">🎉 Completed!</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="recent-activity-widget glass-card">
          <div className="card-header">
            <h3>Recent Expenses</h3>
            <Link to="/expenses" className="card-header-link">
              All Expenses <ChevronRight size={14} />
            </Link>
          </div>

          <div className="recent-list">
            {recentExpenses.length === 0 ? (
              <div className="empty-widget">
                <p>No expenses recorded yet.</p>
              </div>
            ) : (
              recentExpenses.slice(0, 5).map((exp) => (
                <div key={exp.expense_id} className="recent-item">
                  <div className="recent-left">
                    <div className="item-icon expense">🛒</div>
                    <div>
                      <h4>{exp.description || exp.category_name}</h4>
                      <div className="item-meta">
                        <span className="badge badge-category">{exp.category_name}</span>
                        <span>{exp.expense_date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="recent-right">
                    <span className="amount-text expense">
                      - ₹{exp.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;