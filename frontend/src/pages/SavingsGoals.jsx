import React, { useEffect, useState } from "react";
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  Sparkles,
  TrendingUp,
  Award
} from "lucide-react";
import confetti from "canvas-confetti";
import API, { notifyDataChanged } from "../services/api";
import "./SavingsGoals.css";

const PRESET_GOALS = [
  { name: "💻 New Laptop Fund", target: 55000 },
  { name: "✈️ Japan / Vacation Fund", target: 80000 },
  { name: "🛡️ Emergency Student Fund", target: 20000 },
  { name: "🎓 Certification & Course", target: 12000 },
];

function SavingsGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form State
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Deposit Modal State
  const [depositGoalId, setDepositGoalId] = useState(null);
  const [depositAmount, setDepositAmount] = useState("");

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/goals/");
      setGoals(res.data || []);
    } catch (err) {
      console.error("Goals fetch error:", err);
      setError(err.response?.data?.detail || "Failed to load savings goals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!goalName.trim()) {
      setError("Please enter a goal name");
      return;
    }

    if (!targetAmount || Number(targetAmount) <= 0) {
      setError("Please enter a valid target amount greater than 0");
      return;
    }

    try {
      const payload = {
        goal_name: goalName.trim(),
        target_amount: Number(targetAmount),
        current_amount: Number(currentAmount || 0),
        deadline: deadline || null,
      };

      if (isEditing) {
        await API.put(`/goals/${editId}`, payload);
        setSuccess("Savings goal updated successfully!");
      } else {
        await API.post("/goals/", payload);
        setSuccess("Savings goal created successfully!");
      }

      setGoalName("");
      setTargetAmount("");
      setCurrentAmount("");
      setDeadline("");
      setIsEditing(false);
      setEditId(null);

      await fetchGoals();
      notifyDataChanged({ type: "goal_updated" });
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error("Save goal error:", err);
      setError(err.response?.data?.detail || "Failed to save savings goal");
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) return;

    try {
      const res = await API.post(`/goals/${depositGoalId}/deposit`, {
        amount: Number(depositAmount),
      });

      if (res.data.is_completed) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        setSuccess(`🎉 Target reached! Goal '${res.data.goal_name}' completed!`);
      } else {
        setSuccess(`Added ₹${depositAmount} to ${res.data.goal_name}!`);
      }

      setDepositGoalId(null);
      setDepositAmount("");
      await fetchGoals();
      notifyDataChanged({ type: "goal_deposit" });
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error("Deposit error:", err);
      setError("Failed to add deposit");
    }
  };

  const handleEdit = (goal) => {
    setIsEditing(true);
    setEditId(goal.goal_id);
    setGoalName(goal.goal_name);
    setTargetAmount(goal.target_amount);
    setCurrentAmount(goal.current_amount);
    setDeadline(goal.deadline || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this savings goal?")) {
      return;
    }

    try {
      await API.delete(`/goals/${id}`);
      setSuccess("Savings goal deleted successfully!");
      await fetchGoals();
      notifyDataChanged({ type: "goal_deleted" });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Delete goal error:", err);
      setError("Failed to delete savings goal");
    }
  };

  const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount), 0);
  const totalSaved = goals.reduce((sum, g) => sum + Number(g.current_amount), 0);
  const completedGoals = goals.filter((g) => g.is_completed).length;

  return (
    <div className="savings-page-container animate-fade-in">
      {/* Page Header */}
      <div className="page-header-banner savings-theme glass-card">
        <div>
          <h1>Savings Goals Management 🎯</h1>
          <p>Define targets, track your progress milestones, and celebrate achievements</p>
        </div>
        <div className="header-stat-box">
          <span className="stat-label">Total Amount Saved</span>
          <h2 className="stat-value savings-color">
            ₹{totalSaved.toLocaleString("en-IN")}
          </h2>
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

      {/* Summary KPI Cards */}
      <div className="goals-kpi-grid">
        <div className="kpi-card glass-card">
          <span className="kpi-label">Active Goals</span>
          <h3 className="kpi-val">{goals.length}</h3>
        </div>
        <div className="kpi-card glass-card">
          <span className="kpi-label">Total Target</span>
          <h3 className="kpi-val">₹{totalTarget.toLocaleString("en-IN")}</h3>
        </div>
        <div className="kpi-card glass-card">
          <span className="kpi-label">Current Saved</span>
          <h3 className="kpi-val savings-color">
            ₹{totalSaved.toLocaleString("en-IN")}
          </h3>
        </div>
        <div className="kpi-card glass-card">
          <span className="kpi-label">Goals Completed</span>
          <h3 className="kpi-val income-color">
            {completedGoals} / {goals.length}
          </h3>
        </div>
      </div>

      <div className="savings-content-grid">
        {/* Create / Edit Goal Form */}
        <div className="form-card glass-card">
          <div className="card-title">
            <Target size={20} color="#8b5cf6" />
            <h3>{isEditing ? "Edit Savings Goal" : "Create New Savings Goal"}</h3>
          </div>

          {/* Quick Presets */}
          {!isEditing && (
            <div className="presets-container">
              <span className="preset-label">Quick Ideas:</span>
              <div className="preset-chips">
                {PRESET_GOALS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    className="preset-chip"
                    onClick={() => {
                      setGoalName(p.name);
                      setTargetAmount(p.target);
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="custom-form">
            <div className="form-group">
              <label>Goal Name / Target</label>
              <input
                type="text"
                placeholder="e.g. New Laptop Fund"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>
                <DollarSign size={14} /> Target Amount (₹ INR)
              </label>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                min="1"
                step="any"
                required
              />
            </div>

            <div className="form-group">
              <label>Initial Saved Amount (₹ INR)</label>
              <input
                type="number"
                placeholder="e.g. 10000 (optional)"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                min="0"
                step="any"
              />
            </div>

            <div className="form-group">
              <label>
                <Calendar size={14} /> Target Deadline (Optional)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                style={{
                  flex: 1,
                  background:
                    "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                }}
              >
                {isEditing ? "Update Goal" : "+ Create Goal"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setEditId(null);
                    setGoalName("");
                    setTargetAmount("");
                    setCurrentAmount("");
                    setDeadline("");
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Goals Cards List */}
        <div className="goals-display-card glass-card">
          <div className="list-header-bar">
            <h3>Your Savings Goals ({goals.length})</h3>
          </div>

          {loading ? (
            <div className="table-loading">
              <div className="spinner"></div>
              <p>Loading savings goals...</p>
            </div>
          ) : goals.length === 0 ? (
            <div className="table-empty">
              <span className="empty-emoji">🎯</span>
              <h4>No savings goals yet</h4>
              <p>Create your first goal to start budgeting towards your dreams!</p>
            </div>
          ) : (
            <div className="goals-cards-list">
              {goals.map((goal) => (
                <div
                  key={goal.goal_id}
                  className={`goal-full-card ${
                    goal.is_completed ? "completed" : ""
                  }`}
                >
                  <div className="goal-card-top">
                    <div className="goal-title-group">
                      <span className="goal-badge-icon">
                        {goal.is_completed ? "🏆" : "🎯"}
                      </span>
                      <div>
                        <h4>{goal.goal_name}</h4>
                        {goal.deadline && (
                          <span className="deadline-text">
                            Deadline: {goal.deadline}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="goal-card-actions">
                      <button
                        className="btn-deposit"
                        onClick={() => setDepositGoalId(goal.goal_id)}
                        title="Add savings deposit"
                      >
                        <Plus size={14} /> Add Money
                      </button>
                      <button
                        className="btn-icon edit"
                        onClick={() => handleEdit(goal)}
                        title="Edit Goal"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn-icon delete"
                        onClick={() => handleDelete(goal.goal_id)}
                        title="Delete Goal"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="goal-progress-wrap">
                    <div className="progress-info-row">
                      <span className="saved-amount-text">
                        Saved: ₹{Number(goal.current_amount).toLocaleString("en-IN")}
                      </span>
                      <span className="target-amount-text">
                        Target: ₹{Number(goal.target_amount).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="goal-bar-bg-large">
                      <div
                        className={`goal-bar-fill-large ${
                          goal.is_completed ? "completed" : ""
                        }`}
                        style={{
                          width: `${Math.min(goal.progress_percentage, 100)}%`,
                        }}
                      />
                    </div>

                    <div className="progress-bottom-row">
                      <span className="progress-percent-label">
                        {goal.progress_percentage}% achieved
                      </span>
                      {goal.is_completed ? (
                        <span className="badge badge-income">
                          <Sparkles size={12} /> Target Achieved!
                        </span>
                      ) : (
                        <span className="remaining-needed">
                          ₹
                          {Math.max(
                            goal.target_amount - goal.current_amount,
                            0
                          ).toLocaleString("en-IN")}{" "}
                          remaining
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Deposit Modal */}
      {depositGoalId && (
        <div className="modal-backdrop animate-fade-in">
          <div className="modal-card glass-card">
            <h3>💰 Add Money to Savings Goal</h3>
            <p>Enter the amount you would like to deposit towards this goal:</p>

            <form onSubmit={handleDeposit} className="custom-form">
              <div className="form-group">
                <label>Deposit Amount (₹ INR)</label>
                <input
                  type="number"
                  placeholder="e.g. 2000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="1"
                  step="any"
                  autoFocus
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Confirm Deposit
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setDepositGoalId(null);
                    setDepositAmount("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SavingsGoals;
