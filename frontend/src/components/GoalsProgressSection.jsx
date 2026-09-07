import React from "react";
import { Target, CheckCircle2 } from "lucide-react";

function fmt(num) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num || 0);
}

export default function GoalsProgressSection({ goals, loading }) {
  if (loading) {
    return (
      <div className="goals-loading">
        {[1, 2].map((i) => (
          <div key={i} className="analytics-skeleton" style={{ height: 72, marginBottom: 12, borderRadius: 12 }} />
        ))}
      </div>
    );
  }

  if (!goals || goals.length === 0) {
    return (
      <div className="chart-empty">
        <span>🎯</span>
        <p>No savings goals yet</p>
        <small>Create a savings goal to track your progress here</small>
      </div>
    );
  }

  return (
    <div className="goals-progress-list">
      {goals.map((goal) => {
        const pct = Math.min(goal.progress_percentage, 100);
        const isCompleted = goal.is_completed;

        return (
          <div key={goal.goal_id} className="goal-progress-item">
            <div className="goal-progress-header">
              <div className="goal-progress-info">
                {isCompleted ? (
                  <CheckCircle2 size={16} className="goal-complete-icon" />
                ) : (
                  <Target size={16} className="goal-target-icon" />
                )}
                <span className="goal-name">{goal.goal_name}</span>
                {isCompleted && <span className="goal-badge-done">Completed!</span>}
                {goal.deadline && !isCompleted && (
                  <span className="goal-deadline">
                    Due: {new Date(goal.deadline).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
              <div className="goal-progress-amounts">
                <span className="goal-saved">{fmt(goal.current_amount)}</span>
                <span className="goal-separator">/</span>
                <span className="goal-target">{fmt(goal.target_amount)}</span>
                <span
                  className="goal-pct"
                  style={{ color: isCompleted ? "var(--success)" : "var(--primary)" }}
                >
                  {pct}%
                </span>
              </div>
            </div>
            <div className="goal-bar-track">
              <div
                className="goal-bar-fill"
                style={{
                  width: `${pct}%`,
                  background: isCompleted
                    ? "linear-gradient(90deg, var(--success), #059669)"
                    : "linear-gradient(90deg, var(--primary), var(--accent))",
                  transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
