export default function SavingsGoalList({
  goals,
  onEdit,
  onDelete,
  onContribute,
}) {
  const calculateProgress = (goal) => {
    const target = Number(goal.target_amount || 0);
    const current = Number(goal.current_amount || 0);

    if (target <= 0) {
      return 0;
    }

    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">

      {/* HEADER */}

      <div className="p-6 border-b">

        <h2 className="text-2xl font-bold">
          Savings Goals
        </h2>

        <p className="text-gray-600 mt-1">
          Track your savings progress
        </p>

      </div>

      {/* GOALS */}

      <div className="p-6">

        {goals.length === 0 ? (

          <p className="text-center text-gray-500 p-8">
            No savings goals available
          </p>

        ) : (

          <div className="grid gap-6">

            {goals.map((goal) => {

              const targetAmount = Number(
                goal.target_amount || 0
              );

              const currentAmount = Number(
                goal.current_amount || 0
              );

              const progress =
                calculateProgress(goal);

              const remainingAmount = Math.max(
                targetAmount - currentAmount,
                0
              );

              return (

                <div
                  key={goal.id}
                  className="
                    border
                    rounded-xl
                    p-5
                    hover:shadow-md
                    transition
                  "
                >

                  {/* TITLE + STATUS */}

                  <div className="flex justify-between items-start mb-3">

                    <div>

                      <h3 className="text-xl font-bold">
                        {goal.title}
                      </h3>

                      <p className="text-gray-500 mt-1">
                        Target date:{" "}
                        {goal.target_date ||
                          "Not specified"}
                      </p>

                    </div>

                    <span
                      className={`
                        px-3
                        py-1
                        rounded-full
                        text-sm
                        font-medium
                        ${
                          goal.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }
                      `}
                    >
                      {goal.status === "completed"
                        ? "Completed"
                        : "In Progress"}
                    </span>

                  </div>

                  {/* AMOUNTS */}

                  <div className="flex justify-between mb-2">

                    <span className="font-semibold text-green-600">
                      ₹{currentAmount.toFixed(2)}
                    </span>

                    <span className="text-gray-600">
                      Target: ₹{targetAmount.toFixed(2)}
                    </span>

                  </div>

                  {/* PROGRESS BAR */}

                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">

                    <div
                      className={`
                        h-4
                        rounded-full
                        transition-all
                        duration-500
                        ${
                          progress >= 100
                            ? "bg-green-500"
                            : "bg-blue-600"
                        }
                      `}
                      style={{
                        width: `${progress}%`,
                      }}
                    />

                  </div>

                  {/* PROGRESS DETAILS */}

                  <div className="flex justify-between mt-2">

                    <span className="text-sm text-gray-600">
                      {progress.toFixed(1)}% completed
                    </span>

                    {remainingAmount > 0 ? (

                      <span className="text-sm text-gray-600">
                        ₹{remainingAmount.toFixed(2)} remaining
                      </span>

                    ) : (

                      <span className="text-sm font-semibold text-green-600">
                        Goal completed 🎉
                      </span>

                    )}

                  </div>

                  {/* ACTION BUTTONS */}

                  <div className="flex gap-2 mt-5">

                    {/* CONTRIBUTE */}

                    <button
                      onClick={() =>
                        onContribute(goal)
                      }
                      disabled={
                        goal.status === "completed" ||
                        progress >= 100
                      }
                      className="
                        bg-green-600
                        hover:bg-green-700
                        disabled:bg-gray-400
                        text-white
                        px-3
                        py-2
                        rounded-lg
                      "
                    >
                      Contribute
                    </button>

                    {/* EDIT */}

                    <button
                      onClick={() => onEdit(goal)}
                      className="
                        bg-blue-600
                        hover:bg-blue-700
                        text-white
                        px-3
                        py-2
                        rounded-lg
                      "
                    >
                      Edit
                    </button>

                    {/* DELETE */}

                    <button
                      onClick={() =>
                        onDelete(goal.id)
                      }
                      className="
                        bg-red-500
                        hover:bg-red-600
                        text-white
                        px-3
                        py-2
                        rounded-lg
                      "
                    >
                      Delete
                    </button>

                  </div>

                </div>

              );
            })}

          </div>

        )}

      </div>

    </div>
  );
}