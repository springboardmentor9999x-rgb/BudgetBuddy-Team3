import React from "react";

/* =========================================================
   FORMAT CURRENCY
========================================================= */

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}


/* =========================================================
   SAVINGS PROGRESS BAR
========================================================= */

function SavingsProgressBar({ goals = [] }) {

  /* -------------------------------------------------------
     EMPTY STATE
  ------------------------------------------------------- */

  if (goals.length === 0) {
    return (
      <div className="empty-goals">
        <div className="empty-goals-icon">
          <span>🎯</span>
        </div>

        <div className="empty-goals-content">
          <h3>No savings goals yet</h3>

          <p>
            Create your first savings goal and start building
            toward it.
          </p>
        </div>
      </div>
    );
  }


  /* -------------------------------------------------------
     GOALS
  ------------------------------------------------------- */

  return (
    <div className="goals-grid">

      {goals.map((goal) => {

        const percentage = Math.min(
          Math.max(
            Number(goal.percentage || 0),
            0
          ),
          100
        );

        const completed = percentage >= 100;

        const currentAmount =
          Number(goal.current_amount || 0);

        const targetAmount =
          Number(goal.target_amount || 0);

        const remainingAmount = Math.max(
          targetAmount - currentAmount,
          0
        );


        return (
          <div
            key={goal.id}
            className={`goal-card ${
              completed ? "goal-completed" : ""
            }`}
          >

            {/* =========================================
               TOP SECTION
            ========================================= */}

            <div className="goal-card-top">

              <div
                className={`goal-icon ${
                  completed ? "completed" : ""
                }`}
              >
                {completed ? "✓" : "🎯"}
              </div>


              <div className="goal-title-area">

                <h4>
                  {goal.title}
                </h4>

                <span>
                  {completed
                    ? "Goal completed"
                    : "In progress"}
                </span>

              </div>


              <div
                className={`goal-percentage ${
                  completed ? "completed" : ""
                }`}
              >
                {Math.round(percentage)}%
              </div>

            </div>


            {/* =========================================
               PROGRESS BAR
            ========================================= */}

            <div className="goal-progress-section">

              <div className="goal-progress-track">

                <div
                  className="goal-progress-fill"
                  style={{
                    width: `${percentage}%`,
                  }}
                >

                  {percentage >= 15 && (
                    <span className="goal-progress-shine" />
                  )}

                </div>

              </div>

            </div>


            {/* =========================================
               AMOUNT INFORMATION
            ========================================= */}

            <div className="goal-card-bottom">

              <div className="goal-saved-amount">

                <span>
                  Saved
                </span>

                <strong>
                  {formatCurrency(
                    currentAmount
                  )}
                </strong>

              </div>


              <div className="goal-target-amount">

                <span>
                  Target
                </span>

                <strong>
                  {formatCurrency(
                    targetAmount
                  )}
                </strong>

              </div>

            </div>


            {/* =========================================
               REMAINING / COMPLETED MESSAGE
            ========================================= */}

            <div
              className={`goal-status ${
                completed
                  ? "completed"
                  : ""
              }`}
            >

              {completed ? (
                <>
                  <span className="goal-status-icon">
                    ✓
                  </span>

                  <span>
                    You've reached your savings goal!
                  </span>
                </>
              ) : (
                <>
                  <span className="goal-status-icon">
                    →
                  </span>

                  <span>
                    {formatCurrency(
                      remainingAmount
                    )}{" "}
                    remaining
                  </span>
                </>
              )}

            </div>

          </div>
        );
      })}

    </div>
  );
}


export default SavingsProgressBar;