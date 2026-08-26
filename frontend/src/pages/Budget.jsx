import React, { useEffect, useState } from "react";
import {
  PiggyBank,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingDown
} from "lucide-react";
import API, { notifyDataChanged } from "../services/api";
import "./Budget.css";

function Budget() {
  const [budgets, setBudgets] = useState([]);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchBudgetsAndStatus = async () => {
    try {
      setLoading(true);
      setError("");

      const [budgetsRes, statusRes] = await Promise.all([
        API.get("/budget/"),
        API.get(`/budget/status?month=${month}-01`),
      ]);

      setBudgets(budgetsRes.data || []);
      setCurrentStatus(statusRes.data || null);
    } catch (err) {
      console.error("Budget fetch error:", err);
      setError(err.response?.data?.detail || "Failed to load budget data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetsAndStatus();
  }, [month]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid budget amount greater than 0");
      return;
    }

    try {
      await API.post("/budget/", {
        amount: Number(amount),
        month: `${month}-01`,
      });

      setSuccess(`Budget for ${month} saved successfully!`);
      setAmount("");
      await fetchBudgetsAndStatus();
      notifyDataChanged({ type: "budget_updated" });
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error("Save budget error:", err);
      setError(err.response?.data?.detail || "Failed to set budget");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this monthly budget?")) {
      return;
    }

    try {
      await API.delete(`/budget/${id}`);
      setSuccess("Budget deleted successfully!");
      await fetchBudgetsAndStatus();
      notifyDataChanged({ type: "budget_deleted" });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Delete budget error:", err);
      setError("Failed to delete budget");
    }
  };

  const status = currentStatus || {
    budget_amount: 0,
    spent_amount: 0,
    remaining_amount: 0,
    utilization_percentage: 0,
    is_overspent: false,
    is_warning: false,
    month_label: "Selected Month",
  };

  return (
    <div className="budget-page-container animate-fade-in">
      {/* Page Header */}
      <div className="page-header-banner budget-theme glass-card">
        <div>
          <h1>Monthly Budget Planner 📊</h1>
          <p>Set spending caps and monitor real-time monthly budget utilization</p>
        </div>
        <div className="month-picker-box">
          <label>Selected Month:</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="month-input"
          />
        </div>
      </div>

      {success && (
        <div className="alert-success animate-fade-in">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert-error animate-fade-in">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Real-time Budget Status Banner */}
      <div className="budget-status-card glass-card">
        <div className="status-top">
          <div>
            <h2>{status.month_label} Budget Utilization</h2>
            <p>
              {status.budget_amount > 0
                ? `You have spent ₹${status.spent_amount.toLocaleString(
                    "en-IN"
                  )} of your ₹${status.budget_amount.toLocaleString(
                    "en-IN"
                  )} monthly limit.`
                : "No budget defined yet for this month. Set one below!"}
            </p>
          </div>
          <div className="status-badge-area">
            {status.budget_amount > 0 && (
              <span
                className={`status-pill ${
                  status.is_overspent
                    ? "danger"
                    : status.is_warning
                    ? "warning"
                    : "success"
                }`}
              >
                {status.is_overspent ? "🚨 OVER BUDGET" : status.is_warning ? "⚠️ AT RISK (80%+)" : "✅ ON TRACK"}
              </span>
            )}
          </div>
        </div>

        {status.budget_amount > 0 && (
          <>
            <div className="budget-progress-bar-bg">
              <div
                className={`budget-progress-bar-fill ${
                  status.is_overspent
                    ? "danger"
                    : status.is_warning
                    ? "warning"
                    : "success"
                }`}
                style={{
                  width: `${Math.min(status.utilization_percentage, 100)}%`,
                }}
              />
            </div>

            <div className="status-metrics-grid">
              <div className="metric-box">
                <span className="box-label">Monthly Limit</span>
                <strong className="box-val">
                  ₹{status.budget_amount.toLocaleString("en-IN")}
                </strong>
              </div>
              <div className="metric-box">
                <span className="box-label">Total Spent</span>
                <strong className="box-val expense-color">
                  ₹{status.spent_amount.toLocaleString("en-IN")}
                </strong>
              </div>
              <div className="metric-box">
                <span className="box-label">Remaining Balance</span>
                <strong
                  className={`box-val ${
                    status.remaining_amount < 0
                      ? "expense-color"
                      : "income-color"
                  }`}
                >
                  ₹{status.remaining_amount.toLocaleString("en-IN")}
                </strong>
              </div>
              <div className="metric-box">
                <span className="box-label">Utilization</span>
                <strong className="box-val">
                  {status.utilization_percentage}%
                </strong>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="budget-content-grid">
        {/* Set / Update Budget Form */}
        <div className="form-card glass-card">
          <div className="card-title">
            <PiggyBank size={20} color="#6366f1" />
            <h3>Set / Update Monthly Budget</h3>
          </div>

          <form onSubmit={handleSubmit} className="custom-form">
            <div className="form-group">
              <label>
                <Calendar size={14} /> Target Month
              </label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>
                <DollarSign size={14} /> Budget Limit Amount (₹ INR)
              </label>
              <input
                type="number"
                placeholder="e.g. 15000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="any"
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: "8px" }}>
              Save Monthly Budget
            </button>
          </form>
        </div>

        {/* Budget History Card */}
        <div className="list-card glass-card">
          <div className="list-header-bar">
            <h3>Budget History Records ({budgets.length})</h3>
          </div>

          {loading ? (
            <div className="table-loading">
              <div className="spinner"></div>
              <p>Loading budgets...</p>
            </div>
          ) : budgets.length === 0 ? (
            <div className="table-empty">
              <span className="empty-emoji">📊</span>
              <h4>No budgets recorded</h4>
              <p>Set a monthly budget on the left to start controlling your expenses.</p>
            </div>
          ) : (
            <div className="budget-cards-list">
              {budgets.map((b) => (
                <div key={b.budget_id} className="budget-history-item">
                  <div className="history-left">
                    <div className="history-icon">📅</div>
                    <div>
                      <h4>
                        {new Date(b.month).toLocaleDateString("en-IN", {
                          month: "long",
                          year: "numeric",
                        })}
                      </h4>
                      <span className="history-limit-label">
                        Budget Cap:{" "}
                        <strong>₹{Number(b.amount).toLocaleString("en-IN")}</strong>
                      </span>
                    </div>
                  </div>

                  <button
                    className="btn-icon delete"
                    onClick={() => handleDelete(b.budget_id)}
                    title="Delete Budget"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Budget;