function SavingsProgressBar({ goals }) {
  return (
    <div className="chart-card">
      <h2>Savings Goals Progress</h2>

      {goals.length === 0 ? (
        <p>No savings goals available.</p>
      ) : (
        goals.map((goal) => (
          <div key={goal.id} className="goal-progress">
            <div className="goal-header">
              <span>{goal.title}</span>
              <span>{goal.percentage}%</span>
            </div>

            <div className="progress-container">
              <div
                className="progress-bar"
                style={{
                  width: `${Math.min(goal.percentage, 100)}%`,
                }}
              />
            </div>

            <small>
              ₹{goal.current_amount} / ₹{goal.target_amount}
            </small>
          </div>
        ))
      )}
    </div>
  );
}

export default SavingsProgressBar;