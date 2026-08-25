function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function SavingsProgressBar({ goals }) {
  if (goals.length === 0) {
    return (
      <div className="empty-goals">
        <div className="empty-goals-icon">
          🎯
        </div>

        <h3>No savings goals yet</h3>

        <p>
          Create your first savings goal and start building
          toward it.
        </p>
      </div>
    );
  }

  return (
    <div className="goals-grid">
      {goals.map((goal) => {
        const percentage = Math.min(
          Number(goal.percentage || 0),
          100
        );

        const completed = percentage >= 100;

        return (
          <div
            key={goal.id}
            className={`goal-card ${
              completed ? "goal-completed" : ""
            }`}
          >
            <div className="goal-card-top">
              <div className="goal-icon">
                {completed ? "✓" : "🎯"}
              </div>

              <div className="goal-title-area">
                <h4>{goal.title}</h4>

                <span>
                  {completed
                    ? "Goal completed"
                    : "In progress"}
                </span>
              </div>

              <div className="goal-percentage">
                {percentage}%
              </div>
            </div>

            <div className="goal-progress-track">
              <div
                className="goal-progress-fill"
                style={{
                  width: `${percentage}%`,
                }}
              ></div>
            </div>

            <div className="goal-card-bottom">
              <span>
                <strong>
                  {formatCurrency(goal.current_amount)}
                </strong>{" "}
                saved
              </span>

              <span>
                of {formatCurrency(goal.target_amount)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SavingsProgressBar;